import { StashcatAPI } from '../api/request';
import { User, CompanyMember } from './types';

interface UserInfoResponse {
  user: User;
}

interface UsersListResponse {
  users: User[];
}

interface CompanyMembersResponse {
  members: CompanyMember[];
}

export class UserManager {
  constructor(private api: StashcatAPI) {}

  /**
   * Get own user profile
   */
  async getMe(): Promise<User> {
    const data = this.api.createAuthenticatedRequestData({});
    try {
      const response = await this.api.post<UserInfoResponse>('/users/me', data);
      return response.user;
    } catch (error) {
      throw new Error(`Failed to get own profile: ${error instanceof Error ? error.message : error}`);
    }
  }

  /**
   * Get user info by ID
   */
  async getUserInfo(userId: string, withKey = true): Promise<User> {
    const data = this.api.createAuthenticatedRequestData({
      user_id: userId,
      withkey: withKey,
    });
    try {
      const response = await this.api.post<UserInfoResponse>('/users/info', data);
      return response.user;
    } catch (error) {
      throw new Error(`Failed to get user info: ${error instanceof Error ? error.message : error}`);
    }
  }

  /**
   * Get all members of a company
   */
  async getCompanyMembers(companyId: string, noCache = false): Promise<CompanyMember[]> {
    const data = this.api.createAuthenticatedRequestData({
      company_id: companyId,
      no_cache: noCache,
    });
    try {
      const response = await this.api.post<CompanyMembersResponse>('/company/member', data);
      return response.members || [];
    } catch (error) {
      throw new Error(`Failed to get company members: ${error instanceof Error ? error.message : error}`);
    }
  }
}
