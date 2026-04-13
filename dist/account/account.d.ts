import { StashcatAPI } from '../api/request';
import { AccountSettings, ActiveDevice, Notification } from './types';
/** Status values that the stashcat backend recognizes for availability */
export declare const STATUS_AVAILABLE = "verf\u00FCgbar";
export declare const STATUS_DND = "Bitte nicht st\u00F6ren!";
export type OnlineStatus = 'available' | 'do_not_disturb';
export declare class AccountManager {
    private api;
    constructor(api: StashcatAPI);
    /**
     * Change user status message
     */
    changeStatus(status: string): Promise<void>;
    /**
     * Set online availability status.
     * The stashcat backend recognizes the German status text to determine notification behavior.
     * - 'available' → sends "verfügbar" (green dot, notifications enabled)
     * - 'do_not_disturb' → sends "Bitte nicht stören!" (red dot, notifications suppressed)
     */
    setOnlineStatus(status: OnlineStatus): Promise<void>;
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
    /**
     * Delete all notifications
     */
    deleteAllNotifications(): Promise<void>;
}
//# sourceMappingURL=account.d.ts.map