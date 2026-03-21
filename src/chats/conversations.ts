import { StashcatAPI } from '../api/request';
import { Conversation, PaginationOptions } from './types';

interface ConversationsResponse {
  conversations: Conversation[];
}

interface ConversationResponse {
  conversation: Conversation;
}

export class ConversationManager {
  constructor(private api: StashcatAPI) {}

  /** List all conversations with pagination */
  async getConversations(options: PaginationOptions = {}): Promise<Conversation[]> {
    const request = this.api.createAuthenticatedRequestData({
      limit: options.limit || 50,
      offset: options.offset || 0,
      archive: options.archive || 0,
      sorting: options.sorting ? JSON.stringify(options.sorting) : undefined,
    });
    try {
      const response = await this.api.post<ConversationsResponse>('/message/conversations', request);
      return response.conversations || [];
    } catch (error) {
      throw new Error(`Failed to get conversations: ${error instanceof Error ? error.message : error}`);
    }
  }

  /** Get a single conversation by ID */
  async getConversation(conversationId: string): Promise<Conversation> {
    const request = this.api.createAuthenticatedRequestData({ conversation_id: conversationId });
    try {
      const response = await this.api.post<ConversationResponse>('/message/conversation', request);
      return response.conversation;
    } catch (error) {
      throw new Error(`Failed to get conversation: ${error instanceof Error ? error.message : error}`);
    }
  }

  /**
   * Create a new encrypted group conversation.
   * @param memberIds Array of user IDs to add
   * @param uniqueIdentifier Encryption key identifier (bytes as hex string)
   */
  async createEncryptedConversation(memberIds: string[], uniqueIdentifier: string): Promise<Conversation> {
    const request = this.api.createAuthenticatedRequestData({
      members: JSON.stringify(memberIds),
      unique_identifier: uniqueIdentifier,
    });
    try {
      const response = await this.api.post<ConversationResponse>('/message/createEncryptedConversation', request);
      return response.conversation;
    } catch (error) {
      throw new Error(`Failed to create conversation: ${error instanceof Error ? error.message : error}`);
    }
  }

  /** Archive a conversation */
  async archiveConversation(conversationId: string): Promise<void> {
    const request = this.api.createAuthenticatedRequestData({ conversation_id: conversationId });
    try {
      await this.api.post('/message/archiveConversation', request);
    } catch (error) {
      throw new Error(`Failed to archive conversation: ${error instanceof Error ? error.message : error}`);
    }
  }

  /** Set a conversation as favorite */
  async setFavorite(conversationId: string, favorite: boolean): Promise<void> {
    const request = this.api.createAuthenticatedRequestData({ conversation_id: conversationId, favorite });
    try {
      await this.api.post('/message/set_favorite', request);
    } catch (error) {
      throw new Error(`Failed to set conversation favorite: ${error instanceof Error ? error.message : error}`);
    }
  }

  /** Enable push notifications for a conversation */
  async enableNotifications(conversationId: string): Promise<void> {
    const request = this.api.createAuthenticatedRequestData({
      type: 'conversation',
      content_id: conversationId,
    });
    try {
      await this.api.post('/push/enable_notifications', request);
    } catch (error) {
      throw new Error(`Failed to enable notifications: ${error instanceof Error ? error.message : error}`);
    }
  }

  /** Disable push notifications for a conversation */
  async disableNotifications(conversationId: string, duration?: number): Promise<void> {
    const request = this.api.createAuthenticatedRequestData({
      type: 'conversation',
      content_id: conversationId,
      duration,
    });
    try {
      await this.api.post('/push/disable_notifications', request);
    } catch (error) {
      throw new Error(`Failed to disable notifications: ${error instanceof Error ? error.message : error}`);
    }
  }
}
