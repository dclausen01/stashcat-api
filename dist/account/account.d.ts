import { StashcatAPI } from '../api/request';
import { AccountSettings, ActiveDevice, Notification } from './types';
export declare class AccountManager {
    private api;
    constructor(api: StashcatAPI);
    /**
     * Change user status message
     */
    changeStatus(status: string): Promise<void>;
    /**
     * Change account password
     */
    changePassword(oldPassword: string, newPassword: string): Promise<void>;
    /**
     * Get account settings
     */
    getSettings(): Promise<AccountSettings>;
    /**
     * List all active devices for this account
     */
    listActiveDevices(): Promise<ActiveDevice[]>;
    /**
     * Deactivate (remove) a device
     */
    deactivateDevice(deviceId: string): Promise<void>;
    /**
     * Store/update profile image as base64
     */
    storeProfileImage(imgBase64: string): Promise<void>;
    /**
     * Reset profile image to default
     */
    resetProfileImage(): Promise<void>;
    /**
     * Get notifications
     */
    getNotifications(limit?: number, offset?: number): Promise<Notification[]>;
    /**
     * Get unread notification count
     */
    getNotificationCount(): Promise<number>;
    /**
     * Delete a notification
     */
    deleteNotification(notificationId: string): Promise<void>;
}
//# sourceMappingURL=account.d.ts.map