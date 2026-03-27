export interface User {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    status?: string;
    avatar?: string;
    public_key?: string;
    socket_id?: string;
    quota?: number;
    created_at: string;
    updated_at: string;
    online?: boolean;
    allows_voip_calls?: boolean;
    mx_user_id?: string;
    language?: string;
    image?: string;
    roles?: Array<{
        id: string;
        name: string;
        company_id: string;
    }>;
    permissions?: string[];
    is_bot?: boolean;
    deleted?: string | null;
    last_login?: string;
    totp_active?: boolean;
}
export interface Company {
    id: string;
    name: string;
    logo?: string;
    logo_url?: string;
    quota?: number;
    quota_byte?: number;
    max_users?: number;
    users?: number;
    created?: string;
    deleted?: string | null;
    features?: string[];
    marketplace_modules?: string[];
    unread_messages?: number;
    roles?: Array<{
        id: string;
        name: string;
        editable?: boolean;
    }>;
    permission?: string[];
    domains?: string[];
    domain?: string;
    time_joined?: string;
    membership_expiry?: string | null;
    deactivated?: boolean;
}
export interface CompanyMember {
    id: string;
    user_id: string;
    company_id: string;
    role: string;
    joined_at: string;
    user?: User;
}
/** A user record returned by /manage/list_users */
export interface ManagedUser {
    id: string;
    first_name: string;
    last_name: string;
    tag?: string;
    email: string;
    time_joined?: string;
    membership_expiry?: string | null;
    deactivated?: string | null;
    active?: boolean;
    last_login?: string;
    roles?: Array<{
        id: string;
        name: string;
        company_id: string;
    }>;
    image?: string;
    allows_voip_calls?: boolean;
    mx_user_id?: string;
}
/** An AD/LDAP group returned by /manage/list_groups */
export interface CompanyGroup {
    id: string;
    name: string;
    description?: string;
    company?: string;
    ldap_group?: string;
    user_id?: string;
    create_channel?: boolean;
    limit_communication?: boolean;
    count: number;
}
//# sourceMappingURL=types.d.ts.map