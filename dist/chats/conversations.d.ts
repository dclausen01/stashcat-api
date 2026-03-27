import { StashcatAPI } from '../api/request';
import { Conversation, PaginationOptions } from './types';
export declare class ConversationManager {
    private api;
    constructor(api: StashcatAPI);
    /** List all conversations with pagination */
    getConversations(options?: PaginationOptions): Promise<Conversation[]>;
    /** Get a single conversation by ID */
    getConversation(conversationId: string): Promise<Conversation>;
    /**
     * Create a new conversation with the given members.
     * Returns the existing conversation if one already exists with the same members.
     * @param memberIds Array of user IDs to add (do not include own ID)
     */
    createConversation(memberIds: string[]): Promise<Conversation>;
    /**
     * Create a new encrypted group conversation.
     * @param memberIds Array of user IDs to add
     * @param uniqueIdentifier Encryption key identifier (bytes as hex string)
     */
    createEncryptedConversation(memberIds: string[], uniqueIdentifier: string): Promise<Conversation>;
    /** Archive a conversation */
    archiveConversation(conversationId: string): Promise<void>;
    /** Set a conversation as favorite */
    setFavorite(conversationId: string, favorite: boolean): Promise<void>;
    /** Enable push notifications for a conversation */
    enableNotifications(conversationId: string): Promise<void>;
    /** Disable push notifications for a conversation */
    disableNotifications(conversationId: string, duration?: number): Promise<void>;
}
//# sourceMappingURL=conversations.d.ts.map