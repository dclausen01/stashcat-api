import { StashcatAPI } from '../api/request';
import { Message, MessageLiker } from './types';
export interface SendMessageOptions {
    /** Target ID (channel or conversation ID) */
    target: string;
    /** 'channel' or 'conversation' */
    target_type: 'channel' | 'conversation';
    text: string;
    /** File IDs to attach */
    files?: string[];
    /** URL to embed */
    url?: string;
    /** Whether the message is AES-encrypted */
    encrypted?: boolean;
    /** IV for encrypted message (hex) */
    iv?: string;
    /** Latitude for location messages */
    latitude?: number;
    /** Longitude for location messages */
    longitude?: number;
    /** Signature/verification for E2E */
    verification?: string;
    is_forwarded?: boolean;
    /** Reply to a specific message ID */
    reply_to_id?: string;
}
export declare class MessageManager {
    private api;
    constructor(api: StashcatAPI);
    /** Get messages from a channel or conversation */
    getMessages(id: string, chatType: 'channel' | 'conversation', options?: {
        limit?: number;
        offset?: number;
        after_message_id?: string;
        key?: Buffer;
    }): Promise<Message[]>;
    /** Send a message to a channel or conversation */
    sendMessage(options: SendMessageOptions): Promise<Message>;
    /** Delete a message by ID */
    deleteMessage(messageId: string): Promise<void>;
    /**
     * Mark a chat as read.
     *
     * There is no dedicated endpoint (`/message/mark_read` returns HTTP 404, live-verified 2026-10-30):
     * the schul.cloud web client resets the unread counter by simply fetching `/message/content`
     * (`resetUnreadMessagesByServer` in the web bundle). `messageId` is kept for API compatibility
     * but has no effect — the whole chat is marked as read.
     */
    markAsRead(id: string, chatType: 'channel' | 'conversation', _messageId?: string): Promise<void>;
    /** Like a message */
    likeMessage(messageId: string): Promise<void>;
    /** List users who liked a message */
    listLikes(messageId: string): Promise<MessageLiker[]>;
    /** Unlike a message */
    unlikeMessage(messageId: string): Promise<void>;
    /** Flag a message */
    flagMessage(messageId: string): Promise<void>;
    /** Unflag a message */
    unflagMessage(messageId: string): Promise<void>;
    /** Mark a channel or conversation as unread */
    markChatAsUnread(chatType: 'channel' | 'conversation', chatId: string): Promise<void>;
    /** Get flagged messages in a channel or conversation */
    getFlaggedMessages(type: 'channel' | 'conversation', typeId: string, options?: {
        limit?: number;
        offset?: number;
    }): Promise<Message[]>;
    /**
     * Download a file as a Buffer. With `fileKey` (the file's own decrypted AES key — NOT the chat key,
     * see `StashcatClient.getFileKey()`), E2E-encrypted content is decrypted (AES-256-CBC, `e2e_iv`).
     */
    downloadFile(file: {
        id: string;
        encrypted?: boolean;
        e2e_iv?: string | null;
    }, fileKey?: Buffer): Promise<Buffer>;
}
//# sourceMappingURL=messages.d.ts.map