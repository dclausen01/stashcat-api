import { StashcatAPI } from '../api/request';
import { User, Company, CompanyMember, ManagedUser, CompanyGroup } from './types';
export declare class UserManager {
    private api;
    constructor(api: StashcatAPI);
    /**
     * Get own user profile
     */
    getMe(): Promise<User>;
    /**
     * Get user info by ID
     */
    getUserInfo(userId: string, withKey?: boolean): Promise<User>;
    /**
     * Get all companies/organisations the user belongs to.
     * Uses /company/member (without company_id) which returns payload.companies[].
     * Verified via live API test: returns full company details incl. name, features, roles.
     */
    getCompanies(): Promise<Company[]>;
    /**
     * Get detailed info for a single company.
     * Uses /company/details with company_id.
     */
    getCompanyDetails(companyId: string): Promise<Company>;
    /**
     * Get members of a company with optional pagination and search.
     * The API requires an explicit limit parameter — without it, it returns 0 members.
     * @param companyId The company to list members for
     * @param options Optional: limit (default 100), offset, search query, noCache
     */
    getCompanyMembers(companyId: string, options?: {
        limit?: number;
        offset?: number;
        search?: string;
        noCache?: boolean;
    } | boolean): Promise<CompanyMember[]>;
    /**
     * Get all members of a company, auto-paginating through all pages.
     * Use with caution on large companies (4000+ members).
     */
    getAllCompanyMembers(companyId: string): Promise<CompanyMember[]>;
    /**
     * List users via the /manage/list_users admin endpoint.
     * Supports search, pagination (limit/offset), and returns num_total_records.
     * This is the correct endpoint for listing company members on schul.cloud instances.
     */
    listManagedUsers(companyId: string, options?: {
        limit?: number;
        offset?: number;
        search?: string;
        groupIds?: string[];
    }): Promise<{
        users: ManagedUser[];
        total: number;
    }>;
    /**
     * List AD/LDAP groups via /manage/list_groups.
     */
    listGroups(companyId: string): Promise<CompanyGroup[]>;
}
//# sourceMappingURL=users.d.ts.map