"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserManager = void 0;
class UserManager {
    constructor(api) {
        this.api = api;
    }
    /**
     * Get own user profile
     */
    async getMe() {
        const data = this.api.createAuthenticatedRequestData({});
        try {
            const response = await this.api.post('/users/me', data);
            return response.user;
        }
        catch (error) {
            throw new Error(`Failed to get own profile: ${error instanceof Error ? error.message : error}`);
        }
    }
    /**
     * Get user info by ID
     */
    async getUserInfo(userId, withKey = true) {
        const data = this.api.createAuthenticatedRequestData({
            user_id: userId,
            withkey: withKey,
        });
        try {
            const response = await this.api.post('/users/info', data);
            return response.user;
        }
        catch (error) {
            throw new Error(`Failed to get user info: ${error instanceof Error ? error.message : error}`);
        }
    }
    /**
     * Get all companies/organisations the user belongs to.
     * Uses /company/member (without company_id) which returns payload.companies[].
     * Verified via live API test: returns full company details incl. name, features, roles.
     */
    async getCompanies() {
        const data = this.api.createAuthenticatedRequestData({});
        try {
            const response = await this.api.post('/company/member', data);
            return response.companies || [];
        }
        catch (error) {
            throw new Error(`Failed to get companies: ${error instanceof Error ? error.message : error}`);
        }
    }
    /**
     * Get detailed info for a single company.
     * Uses /company/details with company_id.
     */
    async getCompanyDetails(companyId) {
        const data = this.api.createAuthenticatedRequestData({ company_id: companyId });
        try {
            const response = await this.api.post('/company/details', data);
            return response.company;
        }
        catch (error) {
            throw new Error(`Failed to get company details: ${error instanceof Error ? error.message : error}`);
        }
    }
    /**
     * Get members of a company with optional pagination and search.
     * The API requires an explicit limit parameter — without it, it returns 0 members.
     * @param companyId The company to list members for
     * @param options Optional: limit (default 100), offset, search query, noCache
     */
    async getCompanyMembers(companyId, options) {
        // Backwards-compatible: second param used to be `noCache: boolean`
        const opts = typeof options === 'boolean' ? { noCache: options } : (options ?? {});
        const params = {
            company_id: companyId,
            // Always send a limit — the API returns 0 members without it
            limit: opts.limit ?? 100,
        };
        if (opts.noCache)
            params.no_cache = true;
        if (opts.offset)
            params.offset = opts.offset;
        if (opts.search)
            params.search = opts.search;
        const data = this.api.createAuthenticatedRequestData(params);
        try {
            const response = await this.api.post('/company/member', data);
            return response.members || [];
        }
        catch (error) {
            throw new Error(`Failed to get company members: ${error instanceof Error ? error.message : error}`);
        }
    }
    /**
     * Get all members of a company, auto-paginating through all pages.
     * Use with caution on large companies (4000+ members).
     */
    async getAllCompanyMembers(companyId) {
        const PAGE_SIZE = 100;
        const allMembers = [];
        let offset = 0;
        while (true) {
            const batch = await this.getCompanyMembers(companyId, { limit: PAGE_SIZE, offset });
            allMembers.push(...batch);
            if (batch.length < PAGE_SIZE)
                break;
            offset += PAGE_SIZE;
        }
        return allMembers;
    }
    /**
     * List users via the /manage/list_users admin endpoint.
     * Supports search, pagination (limit/offset), and returns num_total_records.
     * This is the correct endpoint for listing company members on schul.cloud instances.
     */
    async listManagedUsers(companyId, options) {
        const opts = options ?? {};
        const params = {
            company_id: companyId,
        };
        if (opts.limit !== undefined)
            params.limit = opts.limit;
        if (opts.offset !== undefined)
            params.offset = opts.offset;
        if (opts.search)
            params.search = opts.search;
        if (opts.groupIds && opts.groupIds.length > 0)
            params.group_ids = JSON.stringify(opts.groupIds);
        const data = this.api.createAuthenticatedRequestData(params);
        try {
            const response = await this.api.post('/manage/list_users', data);
            return {
                users: response.users || [],
                total: response.num_total_records ?? 0,
            };
        }
        catch (error) {
            throw new Error(`Failed to list managed users: ${error instanceof Error ? error.message : error}`);
        }
    }
    /**
     * List AD/LDAP groups via /manage/list_groups.
     */
    async listGroups(companyId) {
        const data = this.api.createAuthenticatedRequestData({ company_id: companyId });
        try {
            const response = await this.api.post('/manage/list_groups', data);
            return response.groups || [];
        }
        catch (error) {
            throw new Error(`Failed to list groups: ${error instanceof Error ? error.message : error}`);
        }
    }
}
exports.UserManager = UserManager;
//# sourceMappingURL=users.js.map