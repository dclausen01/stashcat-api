import { io, Socket } from 'socket.io-client';
import { RealtimeManagerOptions, RealtimeEvents } from './types';

type EventHandler = (...args: unknown[]) => void;

/**
 * RealtimeManager — verbindet mit push.stashcat.com via Socket.io v4.
 *
 * Auth-Flow (reverse-engineered aus schul.cloud Angular-Bundle):
 *   1. io('https://push.stashcat.com', { transports: ['websocket','polling'] })
 *   2. Nach 'connect': socket.emit('userid', { hidden_id, device_id, client_key })
 *      - hidden_id = userInfo.socket_id aus /users/me
 *   3. Server antwortet mit 'new_device_connected' → ab jetzt kommen Events
 *
 * @example
 * const rt = client.createRealtimeManager({ debug: true });
 * await rt.connect();
 * rt.on('message_sync', (data) => console.log('Neue Nachricht:', data));
 * rt.on('new_device_connected', () => console.log('Auth OK!'));
 * // ... später:
 * rt.disconnect();
 */
export class RealtimeManager {
  private socket?: Socket;
  private clientKey: string;
  private deviceId: string;
  private hiddenId: string;   // socket_id aus /users/me — wird als hidden_id beim Auth-Emit genutzt
  private options: Omit<Required<RealtimeManagerOptions>, 'onAnyEvent'> & { onAnyEvent?: (event: string, args: unknown[]) => void };
  private handlers = new Map<string, Set<EventHandler>>();
  private heartbeatTimer?: ReturnType<typeof setInterval>;
  private discoveredEvents = new Set<string>();

  constructor(
    clientKey: string,
    deviceId: string,
    hiddenId: string,
    options: RealtimeManagerOptions = {}
  ) {
    this.clientKey = clientKey;
    this.deviceId = deviceId;
    this.hiddenId = hiddenId;
    this.options = {
      pushUrl: options.pushUrl ?? 'https://push.stashcat.com',
      reconnect: options.reconnect ?? true,
      debug: options.debug ?? false,
      heartbeatInterval: options.heartbeatInterval ?? 5 * 60 * 1000,
      onAnyEvent: options.onAnyEvent,
    };
  }

  /** Verbindet mit dem Push-Server. Gibt ein Promise zurück das resolved wenn die Verbindung steht. */
  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.socket?.connected) {
        resolve();
        return;
      }

      this.socket = io(this.options.pushUrl, {
        transports: ['websocket', 'polling'],
        reconnection: this.options.reconnect,
        reconnectionDelay: 1000,
        reconnectionAttempts: Infinity, // Never give up — server-side disconnect handler manages retry
        timeout: 5000,
        forceNew: true,
        // KEIN query-param, KEIN withCredentials — Auth geschieht via emit nach connect
      });

      this.socket.once('connect', () => {
        if (this.options.debug) {
          console.log('[Realtime] Verbunden, socket.id =', this.socket?.id);
        }

        // Authentifizierung: sofort nach connect 'userid' senden
        // (entspricht onConnect() im Angular-Bundle: socket.emit(Qa.UserId, { hidden_id, device_id, client_key }))
        this.authenticate();
        this.startHeartbeat();

        if (this.options.debug) {
          console.log('[Realtime] Auth-Emit "userid" gesendet, hidden_id =', this.hiddenId.slice(0, 8) + '…');
        }

        this._reattachHandlers();
        resolve();
      });

      this.socket.once('connect_error', (err) => {
        if (this.options.debug) console.error('[Realtime] Verbindungsfehler:', err.message);
        reject(err);
      });

      // Im Debug-Modus: alle empfangenen Events loggen und speichern
      if (this.options.debug) {
        this.socket.onAny((event, ...args) => {
          this.discoveredEvents.add(event);
          console.log(`[Realtime] 📡 "${event}"`, JSON.stringify(args).slice(0, 200));
          this.options.onAnyEvent?.(event, args);
        });
      } else {
        // Auch ohne Debug alle Event-Namen tracken
        this.socket.onAny((event, ...args) => {
          this.discoveredEvents.add(event);
          this.options.onAnyEvent?.(event, args);
        });
      }

      // System-Events weiterleiten
      this.socket.on('disconnect', (reason) => {
        if (this.options.debug) console.log('[Realtime] Getrennt:', reason);
        this._emit('disconnect', reason);
      });

      this.socket.on('connect_error', (err) => {
        if (this.options.debug) console.error('[Realtime] Fehler:', err.message);
        this._emit('connect_error', err);
      });

      // Nach Reconnect erneut authentifizieren. Achtung: In socket.io v4 feuert 'reconnect' am
      // Manager (socket.io), nicht am Socket — ein socket.on('reconnect') wird nie aufgerufen.
      this.socket.io.on('reconnect', () => {
        if (this.options.debug) console.log('[Realtime] Wiederverbunden — sende erneut userid-Auth');
        this.authenticate();
      });
    });
  }

  /**
   * Prüft per `heartbeat`, ob der Push-Server diesen Socket noch als angemeldet führt, und meldet
   * sich bei negativer oder fehlender Antwort neu an. Der Server verwirft die Anmeldung nach einiger
   * Zeit, ohne die Verbindung zu trennen — danach kommen still keine Events mehr. Der schul.cloud-
   * Webclient prüft deshalb alle 5 Minuten (`checkAuthentification`, live-verifiziert 2026-10-30).
   * Läuft automatisch im Intervall `heartbeatInterval`; kann auch manuell aufgerufen werden.
   *
   * @returns 'ok' | 'reauthenticated' (Anmeldung war abgelaufen) | 'no_answer' (vorsorglich neu angemeldet) | 'disconnected'
   */
  checkAuthentication(timeoutMs = 10_000): Promise<'ok' | 'reauthenticated' | 'no_answer' | 'disconnected'> {
    const socket = this.socket;
    if (!socket?.connected) return Promise.resolve('disconnected');
    return new Promise((resolve) => {
      const timer = setTimeout(() => {
        this.authenticate();
        resolve('no_answer');
      }, timeoutMs);
      socket.emit('heartbeat', (authenticated: unknown) => {
        clearTimeout(timer);
        if (authenticated) {
          resolve('ok');
          return;
        }
        if (this.options.debug) console.log('[Realtime] Anmeldung abgelaufen — sende erneut userid-Auth');
        this.authenticate();
        resolve('reauthenticated');
      });
    });
  }

  /** Trennt die Verbindung zum Push-Server */
  disconnect(): void {
    this.stopHeartbeat();
    this.socket?.disconnect();
    this.socket = undefined;
  }

  /** Gibt true zurück wenn aktuell verbunden */
  get connected(): boolean {
    return this.socket?.connected ?? false;
  }

  /** Registriert einen Event-Handler */
  on<K extends keyof RealtimeEvents>(event: K, handler: RealtimeEvents[K]): this;
  on(event: string, handler: EventHandler): this;
  on(event: string, handler: EventHandler): this {
    if (!this.handlers.has(event)) this.handlers.set(event, new Set());
    this.handlers.get(event)!.add(handler);
    this.socket?.on(event, handler);
    return this;
  }

  /** Entfernt einen Event-Handler */
  off(event: string, handler?: EventHandler): this {
    if (handler) {
      this.handlers.get(event)?.delete(handler);
      this.socket?.off(event, handler);
    } else {
      this.handlers.delete(event);
      this.socket?.removeAllListeners(event);
    }
    return this;
  }

  /** Registriert einen einmaligen Event-Handler */
  once(event: string, handler: EventHandler): this {
    const wrapper: EventHandler = (...args) => {
      handler(...args);
      this.off(event, wrapper);
    };
    return this.on(event, wrapper);
  }

  /**
   * Gibt alle seit Verbindungsaufbau empfangenen Event-Namen zurück.
   * Nützlich für die Exploration unbekannter Events (debug: true).
   */
  getDiscoveredEvents(): string[] {
    return Array.from(this.discoveredEvents);
  }

  /** Sende Tipp-Indikator an einen Channel/Conversation */
  sendTyping(chatType: 'channel' | 'conversation', chatId: string): void {
    this.socket?.emit('started-typing', chatType, chatId);
    if (this.options.debug) console.log(`[Realtime] sendTyping: ${chatType}/${chatId}`);
  }

  // ─── Intern ──────────────────────────────────────────────────────────────

  private authenticate(): void {
    this.socket?.emit('userid', {
      hidden_id: this.hiddenId,
      device_id: this.deviceId,
      client_key: this.clientKey,
    });
  }

  private startHeartbeat(): void {
    this.stopHeartbeat();
    if (!this.options.heartbeatInterval) return;
    this.heartbeatTimer = setInterval(() => void this.checkAuthentication(), this.options.heartbeatInterval);
    // Den Prozess nicht nur wegen des Heartbeats am Leben halten
    (this.heartbeatTimer as { unref?: () => void }).unref?.();
  }

  private stopHeartbeat(): void {
    if (this.heartbeatTimer) clearInterval(this.heartbeatTimer);
    this.heartbeatTimer = undefined;
  }

  private _emit(event: string, ...args: unknown[]): void {
    this.handlers.get(event)?.forEach(h => {
      try { h(...args); } catch(e) { /* Handler-Fehler isolieren */ }
    });
  }

  /** Handler nach Reconnect wieder anmelden */
  private _reattachHandlers(): void {
    this.handlers.forEach((handlers, event) => {
      handlers.forEach(h => this.socket?.on(event, h));
    });
  }
}
