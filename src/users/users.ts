import { StashcatAPI } from '../api/request';
import { User, Company, CompanyMember } from './types';

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
   * Get all companies/organisations the user belongs to.
   * Uses /company/member (without company_id) which returns payload.companies[].
   * Verified via live API test: returns full company details incl. name, features, roles.
   */
  async getCompanies(): Promise<Company[]> {
    const data = this.api.createAuthenticatedRequestData({});
    try {
      const response = await this.api.post<{ companies: Company[] }>('/company/member', data);
      return response.companies || [];
    } catch (error) {
      throw new Error(`Failed to get companies: ${error instanceof Error ? error.message : error}`);
    }
  }

  /**
   * Get detailed info for a single company.
   * Uses /company/details with company_id.
   */
  async getCompanyDetails(companyId: string): Promise<Company> {
    const data = this.api.createAuthenticatedRequestData({ company_id: companyId });
    try {
      const response = await this.api.post<{ company: Company }>('/company/details', data);
      return response.company;
    } catch (error) {
      throw new Error(`Failed to get company details: ${error instanceof Error ? error.message : error}`);
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
