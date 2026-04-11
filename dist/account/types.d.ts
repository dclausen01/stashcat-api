export interface AccountSettings {
    email: string;
    first_name: string;
    last_name: string;
    status?: string;
    [key: string]: unknown;
}
export interface ActiveDevice {
    id: string;
    device_id: string;
    app_name: string;
    name?: string;
    last_active: string;
    last_login?: string;
    last_request?: string;
    created_at: string;
    /** Whether the device supports key transfer */
    key_transfer_support?: boolean;
    /** Whether encryption is enabled on this device */
    encryption?: boolean;
    /** Whether the device is fully authenticated */
    is_fully_authed?: boolean;
}
export interface Notification {
    id: string;
    type: string;
    content: string;
    read: boolean;
    created_at: string;
}
//# sourceMappingURL=types.d.ts.map