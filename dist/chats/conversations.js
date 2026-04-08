"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConversationManager = void 0;
class ConversationManager {
    constructor(api) {
        this.api = api;
    }
    /** List all conversations with pagination */
    async getConversations(options = {}) {
        const request = this.api.createAuthenticatedRequestData({
            limit: options.limit || 50,
            offset: options.offset || 0,
            archive: options.archive || 0,
            sorting: options.sorting ? JSON.stringify(options.sorting) : undefined,
        });
        try {
            const response = await this.api.post('/message/conversations', request);
            return (response.conversations || []).map((c) => ({
                ...c,
                unread_count: c.unread_count ?? c.unread_messages ?? 0,
            }));
        }
        catch (error) {
            throw new Error(`Failed to get conversations: ${error instanceof Error ? error.message : error}`);
        }
    }
    /** Get a single conversation by ID */
    async getConversation(conversationId) {
        const request = this.api.createAuthenticatedRequestData({ conversation_id: conversationId });
        try {
            const response = await this.api.post('/message/conversation', request);
            const conv = response.conversation;
            if (conv)
                conv.unread_count = conv.unread_count ?? conv.unread_messages ?? 0;
            return conv;
        }
        catch (error) {
            throw new Error(`Failed to get conversation: ${error instanceof Error ? error.message : error}`);
        }
    }
    /**
     * Create a new conversation with the given members.
     * Returns the existing conversation if one already exists with the same members.
     * @param memberIds Array of user IDs to add (do not include own ID)
     */
    async createConversation(memberIds) {
        const request = this.api.createAuthenticatedRequestData({
            members: JSON.stringify(memberIds),
        });
        try {
            const response = await this.api.post('/message/createConversation', request);
            return response.conversation;
        }
        catch (error) {
            throw new Error(`Failed to create conversation: ${error instanceof Error ? error.message : error}`);
        }
    }
    /**
     * Create a new encrypted group conversation.
     * @param memberIds Array of user IDs to add
     * @param uniqueIdentifier Encryption key identifier (bytes as hex string)
     */
    async createEncryptedConversation(memberIds, uniqueIdentifier) {
        const request = this.api.createAuthenticatedRequestData({
            members: JSON.stringify(memberIds),
            unique_identifier: uniqueIdentifier,
        });
        try {
            const response = await this.api.post('/message/createEncryptedConversation', request);
            return response.conversation;
        }
        catch (error) {
            throw new Error(`Failed to create conversation: ${error instanceof Error ? error.message : error}`);
        }
    }
    /** Archive a conversation */
    async archiveConversation(conversationId) {
        const request = this.api.createAuthenticatedRequestData({ conversation_id: conversationId });
        try {
            await this.api.post('/message/archiveConversation', request);
        }
        catch (error) {
            throw new Error(`Failed to archive conversation: ${error instanceof Error ? error.message : error}`);
        }
    }
    /** Set a conversation as favorite */
    async setFavorite(conversationId, favorite) {
        const request = this.api.createAuthenticatedRequestData({ conversation_id: conversationId, favorite });
        try {
            await this.api.post('/message/set_favorite', request);
        }
        catch (error) {
            throw new Error(`Failed to set conversation favorite: ${error instanceof Error ? error.message : error}`);
        }
    }
    /** Enable push notifications for a conversation */
    async enableNotifications(conversationId) {
        const request = this.api.createAuthenticatedRequestData({
            type: 'conversation',
            content_id: conversationId,
        });
        try {
            await this.api.post('/push/enable_notifications', request);
        }
        catch (error) {
            throw new Error(`Failed to enable notifications: ${error instanceof Error ? error.message : error}`);
        }
    }
    /** Disable push notifications for a conversation */
    async disableNotifications(conversationId, duration) {
        const request = this.api.createAuthenticatedRequestData({
            type: 'conversation',
            content_id: conversationId,
            duration,
        });
        try {
            await this.api.post('/push/disable_notifications', request);
        }
        catch (error) {
            throw new Error(`Failed to disable notifications: ${error instanceof Error ? error.message : error}`);
        }
    }
}
exports.ConversationManager = ConversationManager;
//# sourceMappingURL=conversations.js.map