export interface FileInfo {
  id: string;
  name: string;
  size: number;
  mime_type: string;
  encrypted: boolean;
  e2e_iv?: string;
  folder_id?: string;
  owner_id?: string;
  created_at: string;
  updated_at: string;
}

export interface FolderItem {
  id: string;
  name: string;
  type: 'file' | 'folder';
  size?: number;
  mime_type?: string;
  encrypted?: boolean;
  e2e_iv?: string;
  created_at: string;
  updated_at: string;
}

export interface FolderListOptions {
  folder_id?: string;
  type?: string;
  type_id?: string;
  folder_only?: boolean;
  offset?: number;
  limit?: number;
  search?: string;
  sorting?: string[];
}

export interface FileUploadOptions {
  /** Target type: 'channel' or 'conversation' */
  type: string;
  /** ID of the channel or conversation */
  type_id: string;
  folder?: string;
  encrypted?: boolean;
  iv?: string;
  media_width?: number;
  media_height?: number;
}

export interface FileQuota {
  used: number;
  total: number;
}
