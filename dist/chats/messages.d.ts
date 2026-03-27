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
     * Mark messages as read up to (and including) the given message ID.
     * Pass the ID of the newest visible message to mark all previous as read.
     */
    markAsRead(id: string, chatType: 'channel' | 'conversation', messageId: string): Promise<void>;
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
    /** Get flagged messages in a channel or conversation */
    getFlaggedMessages(type: 'channel' | 'conversation', typeId: string, options?: {
        limit?: number;
        offset?: number;
    }): Promise<Message[]>;
    /** Download a file as a Buffer, optionally decrypting E2E-encrypted content */
    downloadFile(file: {
        id: string;
        encrypted?: boolean;
        e2e_iv?: string | null;
    }, key?: Buffer): Promise<Buffer>;
}
//# sourceMappingURL=messages.d.ts.map