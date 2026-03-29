import { StashcatAPI } from '../api/request';
import { FileInfo, FolderContent, FolderEntry, FolderListOptions, FileUploadOptions, FileQuota } from './types';
export declare class FileManager {
    private api;
    constructor(api: StashcatAPI);
    /** Get metadata for a single file */
    getFileInfo(fileId: string): Promise<FileInfo>;
    /** Get metadata for multiple files */
    getFileInfos(fileIds: string[]): Promise<FileInfo[]>;
    /** List contents of a folder — returns folders and files separately */
    listFolder(options?: FolderListOptions): Promise<FolderContent>;
    /**
     * Listet die persönliche Ablage des eingeloggten Nutzers.
     * Entspricht dem Bereich "Meine Dateien" in der Stashcat-App.
     *
     * @param userId Eigene User-ID (von getMe().id)
     */
    listPersonalFiles(userId: string, options?: Omit<FolderListOptions, 'type' | 'type_id'>): Promise<FolderContent>;
    /** Get storage quota for a channel or conversation */
    getQuota(type: string, typeId: string): Promise<FileQuota>;
    /** Delete one or more files */
    deleteFiles(fileIds: string[]): Promise<void>;
    /** Delete a folder */
    deleteFolder(folderId: number): Promise<void>;
    /** Rename a file */
    renameFile(fileId: string, name: string): Promise<void>;
    /** Move a file to a different folder */
    moveFile(fileId: string, parentId: string): Promise<void>;
    /** Copy a file to a folder in a channel or conversation */
    copyFile(fileId: string, folderId: number, type: string, typeId: string): Promise<void>;
    /** Create a new folder */
    createFolder(name: string, parentId: string, type: string, typeId: string): Promise<FolderEntry>;
    /**
     * Upload a file using Stashcat's resumable upload API.
     * Flow: 1) create_upload_context → 2) upload chunks → 3) return file info
     *
     * @param filePath Absolute or relative path to the file on disk
     * @param uploadOptions Target channel/conversation and optional encryption settings
     * @param chunkSize Chunk size in bytes (default 5 MB to match Stashcat)
     */
    uploadFile(filePath: string, uploadOptions: FileUploadOptions, chunkSize?: number): Promise<FileInfo>;
    private guessMimeType;
}
//# sourceMappingURL=files.d.ts.map