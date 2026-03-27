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
export declare class RealtimeManager {
    private socket?;
    private clientKey;
    private deviceId;
    private hiddenId;
    private options;
    private handlers;
    private discoveredEvents;
    constructor(clientKey: string, deviceId: string, hiddenId: string, options?: RealtimeManagerOptions);
    /** Verbindet mit dem Push-Server. Gibt ein Promise zurück das resolved wenn die Verbindung steht. */
    connect(): Promise<void>;
    /** Trennt die Verbindung zum Push-Server */
    disconnect(): void;
    /** Gibt true zurück wenn aktuell verbunden */
    get connected(): boolean;
    /** Registriert einen Event-Handler */
    on<K extends keyof RealtimeEvents>(event: K, handler: RealtimeEvents[K]): this;
    on(event: string, handler: EventHandler): this;
    /** Entfernt einen Event-Handler */
    off(event: string, handler?: EventHandler): this;
    /** Registriert einen einmaligen Event-Handler */
    once(event: string, handler: EventHandler): this;
    /**
     * Gibt alle seit Verbindungsaufbau empfangenen Event-Namen zurück.
     * Nützlich für die Exploration unbekannter Events (debug: true).
     */
    getDiscoveredEvents(): string[];
    /** Sende Tipp-Indikator an einen Channel/Conversation */
    sendTyping(chatType: 'channel' | 'conversation', chatId: string): void;
    private _emit;
    /** Handler nach Reconnect wieder anmelden */
    private _reattachHandlers;
}
export {};
//# sourceMappingURL=realtime.d.ts.map