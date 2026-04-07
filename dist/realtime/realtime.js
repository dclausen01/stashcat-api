"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RealtimeManager = void 0;
const socket_io_client_1 = require("socket.io-client");
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
class RealtimeManager {
    constructor(clientKey, deviceId, hiddenId, options = {}) {
        this.handlers = new Map();
        this.discoveredEvents = new Set();
        this.clientKey = clientKey;
        this.deviceId = deviceId;
        this.hiddenId = hiddenId;
        this.options = {
            pushUrl: options.pushUrl ?? 'https://push.stashcat.com',
            reconnect: options.reconnect ?? true,
            debug: options.debug ?? false,
            onAnyEvent: options.onAnyEvent,
        };
    }
    /** Verbindet mit dem Push-Server. Gibt ein Promise zurück das resolved wenn die Verbindung steht. */
    connect() {
        return new Promise((resolve, reject) => {
            if (this.socket?.connected) {
                resolve();
                return;
            }
            this.socket = (0, socket_io_client_1.io)(this.options.pushUrl, {
                transports: ['websocket', 'polling'],
                reconnection: this.options.reconnect,
                reconnectionDelay: 1000,
                reconnectionAttempts: 10,
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
                this.socket.emit('userid', {
                    hidden_id: this.hiddenId,
                    device_id: this.deviceId,
                    client_key: this.clientKey,
                });
                if (this.options.debug) {
                    console.log('[Realtime] Auth-Emit "userid" gesendet, hidden_id =', this.hiddenId.slice(0, 8) + '…');
                }
                this._reattachHandlers();
                resolve();
            });
            this.socket.once('connect_error', (err) => {
                if (this.options.debug)
                    console.error('[Realtime] Verbindungsfehler:', err.message);
                reject(err);
            });
            // Im Debug-Modus: alle empfangenen Events loggen und speichern
            if (this.options.debug) {
                this.socket.onAny((event, ...args) => {
                    this.discoveredEvents.add(event);
                    console.log(`[Realtime] 📡 "${event}"`, JSON.stringify(args).slice(0, 200));
                    this.options.onAnyEvent?.(event, args);
                });
            }
            else {
                // Auch ohne Debug alle Event-Namen tracken
                this.socket.onAny((event, ...args) => {
                    this.discoveredEvents.add(event);
                    this.options.onAnyEvent?.(event, args);
                });
            }
            // System-Events weiterleiten
            this.socket.on('disconnect', (reason) => {
                if (this.options.debug)
                    console.log('[Realtime] Getrennt:', reason);
                this._emit('disconnect', reason);
            });
            this.socket.on('connect_error', (err) => {
                if (this.options.debug)
                    console.error('[Realtime] Fehler:', err.message);
                this._emit('connect_error', err);
            });
            // Nach Reconnect erneut authentifizieren
            this.socket.on('reconnect', () => {
                if (this.options.debug)
                    console.log('[Realtime] Wiederverbunden — sende erneut userid-Auth');
                this.socket.emit('userid', {
                    hidden_id: this.hiddenId,
                    device_id: this.deviceId,
                    client_key: this.clientKey,
                });
            });
        });
    }
    /** Trennt die Verbindung zum Push-Server */
    disconnect() {
        this.socket?.disconnect();
        this.socket = undefined;
    }
    /** Gibt true zurück wenn aktuell verbunden */
    get connected() {
        return this.socket?.connected ?? false;
    }
    on(event, handler) {
        if (!this.handlers.has(event))
            this.handlers.set(event, new Set());
        this.handlers.get(event).add(handler);
        this.socket?.on(event, handler);
        return this;
    }
    /** Entfernt einen Event-Handler */
    off(event, handler) {
        if (handler) {
            this.handlers.get(event)?.delete(handler);
            this.socket?.off(event, handler);
        }
        else {
            this.handlers.delete(event);
            this.socket?.removeAllListeners(event);
        }
        return this;
    }
    /** Registriert einen einmaligen Event-Handler */
    once(event, handler) {
        const wrapper = (...args) => {
            handler(...args);
            this.off(event, wrapper);
        };
        return this.on(event, wrapper);
    }
    /**
     * Gibt alle seit Verbindungsaufbau empfangenen Event-Namen zurück.
     * Nützlich für die Exploration unbekannter Events (debug: true).
     */
    getDiscoveredEvents() {
        return Array.from(this.discoveredEvents);
    }
    /** Sende Tipp-Indikator an einen Channel/Conversation */
    sendTyping(chatType, chatId) {
        this.socket?.emit('started-typing', chatType, chatId);
        if (this.options.debug)
            console.log(`[Realtime] sendTyping: ${chatType}/${chatId}`);
    }
    // ─── Intern ──────────────────────────────────────────────────────────────
    _emit(event, ...args) {
        this.handlers.get(event)?.forEach(h => {
            try {
                h(...args);
            }
            catch (e) { /* Handler-Fehler isolieren */ }
        });
    }
    /** Handler nach Reconnect wieder anmelden */
    _reattachHandlers() {
        this.handlers.forEach((handlers, event) => {
            handlers.forEach(h => this.socket?.on(event, h));
        });
    }
}
exports.RealtimeManager = RealtimeManager;
//# sourceMappingURL=realtime.js.map