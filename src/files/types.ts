/**
 * Datei-Metadaten wie sie von /file/info und /file/infos zurückkommen.
 * Feldnamen entsprechen direkt der API-Response.
 */
export interface FileInfo {
  id: string;
  name: string;
  /** Dateigröße als lesbarer String (z. B. "0 kb") */
  size: string;
  /** Genaue Größe in Bytes (als String) */
  size_byte: string;
  size_string?: string;
  /** MIME-Typ (API-Feld heißt "mime", nicht "mime_type") */
  mime: string;
  /** Dateiendung ohne Punkt */
  ext?: string;
  encrypted: boolean;
  e2e_iv?: string | null;
  /** Ordner-Typ: "channel", "conversation" oder "personal" */
  folder_type?: string;
  type_id?: string;
  virtual_folder?: string | null;
  owner_id?: string;
  /** Vollständiges Owner-Objekt (nur bei /file/info) */
  owner?: {
    id: string;
    first_name: string;
    last_name: string;
    /** Volle URL zum Profilbild, z. B. https://api.stashcat.com/images/profile/{token}.jpg */
    image?: string;
    online?: boolean;
    status?: string;
  };
  /** Unix-Timestamp als String */
  uploaded?: string;
  /** Unix-Timestamp als String */
  modified?: string;
  deleted?: string | null;
  md5?: string;
  permission?: string;
  times_downloaded?: string;
  last_download?: string | null;
  dimensions?: { width: number | null; height: number | null };
  base_64?: string | null;
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
  /** Dateien im Ordner (API liefert `file`, wird intern auf `files` gemappt) */
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
  /** Überschreibt den Dateinamen (Standard: path.basename(filePath)). Nützlich wenn der
   *  Pfad einen temporären Namen trägt (z. B. durch multer), aber der Originalname erhalten
   *  bleiben soll. */
  filename?: string;
}

export interface FileQuota {
  used: number;
  total: number;
}
