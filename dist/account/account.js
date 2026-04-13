"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AccountManager = exports.STATUS_DND = exports.STATUS_AVAILABLE = void 0;
/** Status values that the stashcat backend recognizes for availability */
exports.STATUS_AVAILABLE = 'verfügbar';
exports.STATUS_DND = 'Bitte nicht stören!';
class AccountManager {
    constructor(api) {
        this.api = api;
    }
    /**
     * Change user status message
     */
    async changeStatus(status) {
        const data = this.api.createAuthenticatedRequestData({ status });
        try {
            await this.api.post('/account/change_status', data);
        }
        catch (error) {
            throw new Error(`Failed to change status: ${error instanceof Error ? error.message : error}`);
        }
    }
    /**
     * Set online availability status.
     * The stashcat backend recognizes the German status text to determine notification behavior.
     * - 'available' → sends "verfügbar" (green dot, notifications enabled)
     * - 'do_not_disturb' → sends "Bitte nicht stören!" (red dot, notifications suppressed)
     */
    async setOnlineStatus(status) {
        const statusText = status === 'available' ? exports.STATUS_AVAILABLE : exports.STATUS_DND;
        return this.changeStatus(statusText);
    }
    /**
     * Change account password
     */
    async changePassword(oldPassword, newPassword) {
        const data = this.api.createAuthenticatedRequestData({
            old_password: oldPassword,
            new_password: newPassword,
        });
        try {
            await this.api.post('/account/change_password', data);
        }
        catch (error) {
            throw new Error(`Failed to change password: ${error instanceof Error ? error.message : error}`);
        }
    }
    /**
     * Get account settings
     */
    async getSettings() {
        const data = this.api.createAuthenticatedRequestData({});
        try {
            const response = await this.api.post('/account/settings', data);
            return response.settings;
        }
        catch (error) {
            throw new Error(`Failed to get account settings: ${error instanceof Error ? error.message : error}`);
        }
    }
    /**
     * List all active devices for this account
     */
    async listActiveDevices() {
        const data = this.api.createAuthenticatedRequestData({});
        try {
            const response = await this.api.post('/account/list_active_devices', data);
            return response.devices || [];
        }
        catch (error) {
            throw new Error(`Failed to list active devices: ${error instanceof Error ? error.message : error}`);
        }
    }
    /**
     * Deactivate (remove) a device
     */
    async deactivateDevice(deviceId) {
        const data = this.api.createAuthenticatedRequestData({ device_to_remove: deviceId });
        try {
            await this.api.post('/account/deactivate_device', data);
        }
        catch (error) {
            throw new Error(`Failed to deactivate device: ${error instanceof Error ? error.message : error}`);
        }
    }
    /**
     * Store/update profile image as base64
     */
    async storeProfileImage(imgBase64) {
        const data = this.api.createAuthenticatedRequestData({ imgBase64 });
        try {
            await this.api.post('/account/store_profile_image', data);
        }
        catch (error) {
            throw new Error(`Failed to store profile image: ${error instanceof Error ? error.message : error}`);
        }
    }
    /**
     * Reset profile image to default
     */
    async resetProfileImage() {
        const data = this.api.createAuthenticatedRequestData({});
        try {
            await this.api.post('/account/reset_profile_image', data);
        }
        catch (error) {
            throw new Error(`Failed to reset profile image: ${error instanceof Error ? error.message : error}`);
        }
    }
    /**
     * Get notifications
     */
    async getNotifications(limit = 20, offset = 0) {
        const data = this.api.createAuthenticatedRequestData({ limit, offset });
        try {
            const response = await this.api.post('/notifications/get', data);
            return response.notifications || [];
        }
        catch (error) {
            throw new Error(`Failed to get notifications: ${error instanceof Error ? error.message : error}`);
        }
    }
    /**
     * Get unread notification count
     */
    async getNotificationCount() {
        const data = this.api.createAuthenticatedRequestData({});
        try {
            const response = await this.api.post('/notifications/count', data);
            return response.count || 0;
        }
        catch (error) {
            throw new Error(`Failed to get notification count: ${error instanceof Error ? error.message : error}`);
        }
    }
    /**
     * Delete a notification
     */
    async deleteNotification(notificationId) {
        const data = this.api.createAuthenticatedRequestData({ notification_id: notificationId });
        try {
            await this.api.post('/notifications/delete', data);
        }
        catch (error) {
            throw new Error(`Failed to delete notification: ${error instanceof Error ? error.message : error}`);
        }
    }
}
exports.AccountManager = AccountManager;
//# sourceMappingURL=account.js.map