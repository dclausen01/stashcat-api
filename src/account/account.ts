import { StashcatAPI } from '../api/request';
import { AccountSettings, ActiveDevice, Notification } from './types';

interface AccountSettingsResponse {
  settings: AccountSettings;
}

interface DevicesResponse {
  devices: ActiveDevice[];
}

interface NotificationsResponse {
  notifications: Notification[];
  count?: number;
}

interface NotificationCountResponse {
  count: number;
}

export class AccountManager {
  constructor(private api: StashcatAPI) {}

  /**
   * Change user status message
   */
  async changeStatus(status: string): Promise<void> {
    const data = this.api.createAuthenticatedRequestData({ status });
    try {
      await this.api.post('/account/change_status', data);
    } catch (error) {
      throw new Error(`Failed to change status: ${error instanceof Error ? error.message : error}`);
    }
  }

  /**
   * Change account password
   */
  async changePassword(oldPassword: string, newPassword: string): Promise<void> {
    const data = this.api.createAuthenticatedRequestData({
      old_password: oldPassword,
      new_password: newPassword,
    });
    try {
      await this.api.post('/account/change_password', data);
    } catch (error) {
      throw new Error(`Failed to change password: ${error instanceof Error ? error.message : error}`);
    }
  }

  /**
   * Get account settings
   */
  async getSettings(): Promise<AccountSettings> {
    const data = this.api.createAuthenticatedRequestData({});
    try {
      const response = await this.api.post<AccountSettingsResponse>('/account/settings', data);
      return response.settings;
    } catch (error) {
      throw new Error(`Failed to get account settings: ${error instanceof Error ? error.message : error}`);
    }
  }

  /**
   * List all active devices for this account
   */
  async listActiveDevices(): Promise<ActiveDevice[]> {
    const data = this.api.createAuthenticatedRequestData({});
    try {
      const response = await this.api.post<DevicesResponse>('/account/list_active_devices', data);
      return response.devices || [];
    } catch (error) {
      throw new Error(`Failed to list active devices: ${error instanceof Error ? error.message : error}`);
    }
  }

  /**
   * Deactivate (remove) a device
   */
  async deactivateDevice(deviceId: string): Promise<void> {
    const data = this.api.createAuthenticatedRequestData({ device_to_remove: deviceId });
    try {
      await this.api.post('/account/deactivate_device', data);
    } catch (error) {
      throw new Error(`Failed to deactivate device: ${error instanceof Error ? error.message : error}`);
    }
  }

  /**
   * Store/update profile image as base64
   */
  async storeProfileImage(imgBase64: string): Promise<void> {
    const data = this.api.createAuthenticatedRequestData({ imgBase64 });
    try {
      await this.api.post('/account/store_profile_image', data);
    } catch (error) {
      throw new Error(`Failed to store profile image: ${error instanceof Error ? error.message : error}`);
    }
  }

  /**
   * Reset profile image to default
   */
  async resetProfileImage(): Promise<void> {
    const data = this.api.createAuthenticatedRequestData({});
    try {
      await this.api.post('/account/reset_profile_image', data);
    } catch (error) {
      throw new Error(`Failed to reset profile image: ${error instanceof Error ? error.message : error}`);
    }
  }

  /**
   * Get notifications
   */
  async getNotifications(limit = 20, offset = 0): Promise<Notification[]> {
    const data = this.api.createAuthenticatedRequestData({ limit, offset });
    try {
      const response = await this.api.post<NotificationsResponse>('/notifications/get', data);
      return response.notifications || [];
    } catch (error) {
      throw new Error(`Failed to get notifications: ${error instanceof Error ? error.message : error}`);
    }
  }

  /**
   * Get unread notification count
   */
  async getNotificationCount(): Promise<number> {
    const data = this.api.createAuthenticatedRequestData({});
    try {
      const response = await this.api.post<NotificationCountResponse>('/notifications/count', data);
      return response.count || 0;
    } catch (error) {
      throw new Error(`Failed to get notification count: ${error instanceof Error ? error.message : error}`);
    }
  }
}
