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
  last_active: string;
  created_at: string;
}

export interface Notification {
  id: string;
  type: string;
  content: string;
  read: boolean;
  created_at: string;
}
