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

export interface FolderEntry {
  id: string;
  name: string;
  parent_id: string | null;
  type: string;
  type_id: string;
  permission: string;
  creator: string;
  created: string;
  modified: string;
  size_byte: number;
}

export interface FileEntry {
  id: string;
  name: string;
  virtual_folder: string | null;
  size: string;
  size_byte: string;
  size_string: string;
  folder_type: string;
  type_id: string;
  ext: string;
  mime: string;
  encrypted?: boolean;
  e2e_iv?: string;
}

/** @deprecated Verwende FolderEntry / FileEntry */
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

export interface FolderContent {
  folder: FolderEntry[];
  files: FileEntry[];
}

/**
 * Bekannte Werte für den `type`-Parameter bei Ordner- und Upload-Operationen:
 * - `'channel'`      – Geteilte Dateien eines Kanals
 * - `'conversation'` – Geteilte Dateien einer Konversation
 * - `'personal'`     – Persönliche Ablage des eingeloggten Nutzers (type_id = eigene User-ID)
 */
export type FileStorageType = 'channel' | 'conversation' | 'personal';

export interface FolderListOptions {
  folder_id?: string;
  /** Speicherbereich: 'channel', 'conversation' oder 'personal' (persönliche Ablage) */
  type?: FileStorageType | string;
  type_id?: string;
  folder_only?: boolean;
  offset?: number;
  limit?: number;
  search?: string;
  sorting?: string[];
}

export interface FileUploadOptions {
  /** Speicherbereich: 'channel', 'conversation' oder 'personal' (persönliche Ablage) */
  type: FileStorageType | string;
  /** ID des Channels/der Konversation; bei type='user' nicht erforderlich */
  type_id?: string;
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
