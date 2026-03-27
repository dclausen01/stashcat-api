/**
 * Echtzeit-Event-Types für push.stashcat.com (Socket.io v4)
 *
 * Auth-Flow (verifiziert via reverse engineering + Live-Test):
 *   1. connect to 'https://push.stashcat.com'
 *   2. on 'connect': emit('userid', { hidden_id: socket_id, device_id, client_key })
 *      - socket_id kommt aus /users/me → Feld 'socket_id'
 *   3. Server antwortet mit 'new_device_connected' → Events fließen
 *
 * Alle Event-Namen aus dem Angular-Bundle (Qa-Enum) + Live-verifizierte Events.
 */
/** Alle bekannten Echtzeit-Events von push.stashcat.com */
export interface RealtimeEvents {
    /**
     * Neue oder aktualisierte Nachricht in Channel oder Conversation.
     * Payload: vollständiges Message-Objekt (identisch mit REST /message/content)
     * Live-verifiziert: channel_id, text (verschlüsselt), sender, time, etc.
     */
    message_sync: (data: MessageSyncPayload) => void;
    /**
     * Nutzer tippt in einem Channel.
     * Payload: [chatType: 'channel'|'conversation', chatId: number, userId: number]
     * Live-verifiziert: ['channel', 3279211, 7369251]
     */
    'user-started-typing': (chatType: string, chatId: number, userId: number) => void;
    /** Nutzer hat aufgehört zu tippen */
    'started-typing': (...args: unknown[]) => void;
    /** Server bestätigt neue Socket-Verbindung für ein Gerät */
    new_device_connected: (data: {
        device_id: string;
        ip_address: string;
    }) => void;
    /** Eine andere Verbindung für dieses Gerät wurde getrennt */
    device_disconnected: (data: {
        device_id: string;
    }) => void;
    /** Neuer Login von einem anderen Gerät */
    new_login: (data: unknown) => void;
    channel_modified: (data: unknown) => void;
    channel_created: (data: unknown) => void;
    channel_deleted: (data: unknown) => void;
    channel_membership_gained: (data: unknown) => void;
    channel_membership_lost: (data: unknown) => void;
    object_change: (data: unknown) => void;
    file_change: (data: unknown) => void;
    message_read: (data: unknown) => void;
    notification: (data: unknown) => void;
    new_invite: (data: unknown) => void;
    online_status_change: (data: unknown) => void;
    call_created: (data: unknown) => void;
    call_changed: (data: unknown) => void;
    key_sync_request: (data: unknown) => void;
    key_sync_payload: (data: unknown) => void;
    key_sync_abort: (data: unknown) => void;
    send_encrypted_data_to_device: (data: unknown) => void;
    encrypted_data_from_device: (data: unknown) => void;
    device_to_device_message: (data: unknown) => void;
    one_time_key_claimed: (data: unknown) => void;
    new_mx_device: (data: unknown) => void;
    removed_mx_device: (data: unknown) => void;
    /** Socket.io Verbindung hergestellt */
    connect: () => void;
    /** Socket.io Verbindung getrennt */
    disconnect: (reason: string) => void;
    /** Socket.io Verbindungsfehler */
    connect_error: (error: Error) => void;
    /** Catch-all für unbekannte Events */
    [event: string]: (...args: any[]) => void;
}
/**
 * Payload des 'message_sync' Events.
 * Live-verifiziert via reverse engineering + Live-Test (2026-03-21).
 * Die Struktur entspricht dem Message-Objekt aus /message/content.
 */
export interface MessageSyncPayload {
    id: number;
    text: string;
    conversation_id: number;
    channel_id: number;
    thread_id: number;
    hash: string;
    verification: string;
    broadcast: unknown | null;
    alarm: boolean;
    confirmation_required: boolean;
    time: number;
    micro_time: number;
    sender: {
        id: string;
        first_name: string;
        last_name: string;
        online: boolean;
        deleted: unknown | null;
        mx_user_id?: string;
        image?: string;
    };
    deleted: boolean;
    is_deleted_by_manager: boolean;
    kind: string;
    type: string;
    location: unknown | null;
    reciever: unknown[];
    files: unknown[];
    likes: number;
    liked: boolean;
    flagged: boolean;
    tags: unknown[];
    links: unknown[];
    seen_by_others: boolean;
    unread: boolean;
    encrypted: boolean;
    iv: string | null;
    reply_to: unknown | null;
    is_forwarded: boolean;
    metainfo: unknown | null;
    messagePayload: unknown | null;
    has_file_attached: boolean;
    webhook: unknown | null;
    reactions: unknown[];
    channel: unknown | null;
}
export interface RealtimeManagerOptions {
    /** Base URL des Push-Servers (Standard: 'https://push.stashcat.com') */
    pushUrl?: string;
    /** Automatisch neu verbinden bei Verbindungsabbruch (Standard: true) */
    reconnect?: boolean;
    /** Debug-Modus: loggt alle empfangenen Events auf console (Standard: false) */
    debug?: boolean;
}
//# sourceMappingURL=types.d.ts.map