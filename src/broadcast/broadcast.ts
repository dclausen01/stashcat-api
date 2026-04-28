import { StashcatAPI } from '../api/request';
import { Message } from '../chats/types';
import { Broadcast, BroadcastContentOptions, SendBroadcastOptions, BroadcastMemberListOptions, BroadcastMember } from './types';

export class BroadcastManager {
  constructor(private api: StashcatAPI) {}

  /**
   * List all broadcast lists owned by or accessible to the user.
   */
  async listBroadcasts(): Promise<Broadcast[]> {
    const data = this.api.createAuthenticatedRequestData({});
    try {
      const response = await this.api.post<{ lists: Broadcast[] }>('/broadcast/list', data);
      return response.lists || [];
    } catch (error) {
      throw new Error(`Failed to list broadcasts: ${error instanceof Error ? error.message : error}`);
    }
  }

  /**
   * Create a new broadcast list.
   * @param name Name of the broadcast list
   * @param memberIds User IDs to add as members
   * @returns The created broadcast list
   */
  async createBroadcast(name: string, memberIds: string[]): Promise<Broadcast> {
    const data = this.api.createAuthenticatedRequestData({
      name,
      members: JSON.stringify(memberIds),
    });
    try {
      const response = await this.api.post<{ list: Broadcast }>('/broadcast/create', data);
      return response.list;
    } catch (error) {
      throw new Error(`Failed to create broadcast: ${error instanceof Error ? error.message : error}`);
    }
  }

  /**
   * Delete a broadcast list.
   */
  async deleteBroadcast(listId: string): Promise<void> {
    const data = this.api.createAuthenticatedRequestData({
      list_id: listId,
    });
    try {
      await this.api.post<{ success: boolean }>('/broadcast/delete', data);
    } catch (error) {
      throw new Error(`Failed to delete broadcast: ${error instanceof Error ? error.message : error}`);
    }
  }

  /**
   * Rename a broadcast list.
   */
  async renameBroadcast(listId: string, name: string): Promise<void> {
    const data = this.api.createAuthenticatedRequestData({
      list_id: listId,
      name,
    });
    try {
      await this.api.post<{ list: Broadcast }>('/broadcast/rename', data);
    } catch (error) {
      throw new Error(`Failed to rename broadcast: ${error instanceof Error ? error.message : error}`);
    }
  }

  /**
   * Add members to a broadcast list.
   */
  async addMembers(listId: string, memberIds: string[]): Promise<void> {
    const data = this.api.createAuthenticatedRequestData({
      list_id: listId,
      members: JSON.stringify(memberIds),
    });
    try {
      await this.api.post<{ success: boolean }>('/broadcast/add', data);
    } catch (error) {
      throw new Error(`Failed to add broadcast members: ${error instanceof Error ? error.message : error}`);
    }
  }

  /**
   * Remove members from a broadcast list.
   */
  async removeMembers(listId: string, memberIds: string[]): Promise<void> {
    const data = this.api.createAuthenticatedRequestData({
      list_id: listId,
      members: JSON.stringify(memberIds),
    });
    try {
      await this.api.post<{ success: boolean }>('/broadcast/remove', data);
    } catch (error) {
      throw new Error(`Failed to remove broadcast members: ${error instanceof Error ? error.message : error}`);
    }
  }

  /**
   * List members of a broadcast list.
   */
  async listMembers(listId: string, options: BroadcastMemberListOptions = {}): Promise<BroadcastMember[]> {
    const data = this.api.createAuthenticatedRequestData({
      list_id: listId,
      sorting: JSON.stringify(['firstName', 'lastName']),
      limit: options.limit ?? 200,
      offset: options.offset ?? 0,
    });
    try {
      const response = await this.api.post<{ list_members: BroadcastMember[] }>('/broadcast/list_members', data);
      return response.list_members || [];
    } catch (error) {
      throw new Error(`Failed to list broadcast members: ${error instanceof Error ? error.message : error}`);
    }
  }

  /**
   * Get messages (content) from a broadcast list.
   */
  async getContent(options: BroadcastContentOptions): Promise<Message[]> {
    const data = this.api.createAuthenticatedRequestData({
      list_id: options.list_id,
      limit: options.limit ?? 50,
      offset: options.offset ?? 0,
      ...(options.timestamp !== undefined ? { timestamp: options.timestamp } : {}),
      ...(options.before_timestamp !== undefined ? { before_timestamp: options.before_timestamp } : {}),
      ...(options.only_messages_having_files ? { only_messages_having_files: true } : {}),
    });
    try {
      const response = await this.api.post<{ messages: Message[] }>('/broadcast/content', data);
      return response.messages || [];
    } catch (error) {
      throw new Error(`Failed to get broadcast content: ${error instanceof Error ? error.message : error}`);
    }
  }

  /**
   * Send a message to all members of a broadcast list.
   * @returns The sent message
   */
  async sendMessage(options: SendBroadcastOptions): Promise<Message> {
    const data = this.api.createAuthenticatedRequestData({
      list_id: options.list_id,
      text: options.text,
      ...(options.files ? { files: options.files } : {}),
      ...(options.metainfo ? { metainfo: JSON.stringify(options.metainfo) } : {}),
    });
    try {
      const response = await this.api.post<{ message: Message }>('/broadcast/send', data);
      return response.message;
    } catch (error) {
      throw new Error(`Failed to send broadcast message: ${error instanceof Error ? error.message : error}`);
    }
  }
}
