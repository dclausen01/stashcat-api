/** A broadcast list (one-to-many messaging) */
export interface Broadcast {
    id: number;
    user_id: number;
    name: string;
    /** Unix timestamp (seconds) */
    created: number;
    /** Unix timestamp (seconds) of last activity */
    lastAction: number;
    member_count: number;
}
/** Options for listing broadcast messages */
export interface BroadcastContentOptions {
    list_id: string;
    limit?: number;
    offset?: number;
    /** Unix timestamp (seconds) — fetch messages after this time */
    timestamp?: number;
    /** Unix timestamp (seconds) — fetch messages before this time */
    before_timestamp?: number;
    /** Only return messages that have file attachments */
    only_messages_having_files?: boolean;
}
/** Options for sending a broadcast message */
export interface SendBroadcastOptions {
    list_id: string;
    text: string;
    /** File IDs to attach */
    files?: string;
    /** Additional metadata (JSON-serializable) */
    metainfo?: Record<string, unknown>;
}
/** Sort field for member listing */
export type BroadcastMemberSortField = 'firstName' | 'lastName' | string;
/** Options for listing broadcast members */
export interface BroadcastMemberListOptions {
    limit?: number;
    offset?: number;
    sorting?: BroadcastMemberSortField[];
}
//# sourceMappingURL=types.d.ts.map