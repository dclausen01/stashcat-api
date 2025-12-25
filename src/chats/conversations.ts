import { StashcatAPI } from '../api/request';
import { Conversation, PaginationOptions } from './types';

interface ConversationsResponse {
  conversations: Conversation[];
}

export class ConversationManager {
  private api: StashcatAPI;

  constructor(api: StashcatAPI) {
    this.api = api;
  }

  async getConversations(options: PaginationOptions = {}): Promise<Conversation[]> {
    const request = this.api.createAuthenticatedRequestData({
      limit: options.limit || 50,
      offset: options.offset || 0,
      archive: options.archive || 0,
      sorting: options.sorting || [],
    });

    try {
      const response = await this.api.post<ConversationsResponse>('/message/conversations', request);
      return response.conversations || [];
    } catch (error) {
      throw new Error(`Failed to get conversations: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}
