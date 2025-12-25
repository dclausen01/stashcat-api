import { StashcatAPI } from '../api/request';
import { Channel, PaginationOptions } from './types';

interface ChannelsResponse {
  channels: Channel[];
}

export class ChannelManager {
  private api: StashcatAPI;

  constructor(api: StashcatAPI) {
    this.api = api;
  }

  async getChannels(companyId: string): Promise<Channel[]> {
    const request = this.api.createAuthenticatedRequestData({
      company_id: companyId,
    });

    try {
      const response = await this.api.post<ChannelsResponse>('/channels/subscripted', request);
      return response.channels || [];
    } catch (error) {
      throw new Error(`Failed to get channels: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}
