"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FileManager = void 0;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const axios_1 = __importDefault(require("axios"));
class FileManager {
    constructor(api) {
        this.api = api;
    }
    /** Get metadata for a single file */
    async getFileInfo(fileId) {
        const data = this.api.createAuthenticatedRequestData({ file_id: fileId });
        try {
            const response = await this.api.post('/file/info', data);
            return response.file;
        }
        catch (error) {
            throw new Error(`Failed to get file info: ${error instanceof Error ? error.message : error}`);
        }
    }
    /** Get metadata for multiple files */
    async getFileInfos(fileIds) {
        const data = this.api.createAuthenticatedRequestData({ file_ids: fileIds });
        try {
            const response = await this.api.post('/file/infos', data);
            return response.files || [];
        }
        catch (error) {
            throw new Error(`Failed to get file infos: ${error instanceof Error ? error.message : error}`);
        }
    }
    /** List contents of a folder — returns folders and files separately */
    async listFolder(options = {}) {
        const sorting = options.sorting
            ? JSON.stringify(options.sorting)
            : JSON.stringify(['created_desc']);
        const params = {
            folder_id: options.folder_id ?? '0',
            type: options.type,
            type_id: options.type_id,
            offset: options.offset ?? 0,
            limit: options.limit ?? 75,
            search: options.search,
            sorting,
            fields: '',
        };
        // Only send folder_only when explicitly true — the API treats any non-empty
        // value (including 'no') as truthy, which suppresses file results.
        if (options.folder_only === true) {
            params.folder_only = 'yes';
        }
        const data = this.api.createAuthenticatedRequestData(params);
        try {
            // API returns payload.content.folder[] and payload.content.file[] (singular)
            const response = await this.api.post('/folder/get', data);
            const content = response.content ?? {};
            return {
                folder: content.folder ?? [],
                // API may return "file" (singular) or "files" (plural) depending on context
                files: content.file ?? content.files ?? [],
            };
        }
        catch (error) {
            throw new Error(`Failed to list folder: ${error instanceof Error ? error.message : error}`);
        }
    }
    /**
     * Listet die persönliche Ablage des eingeloggten Nutzers.
     * Entspricht dem Bereich "Meine Dateien" in der Stashcat-App.
     *
     * @param userId Eigene User-ID (von getMe().id)
     */
    async listPersonalFiles(userId, options = {}) {
        return this.listFolder({ ...options, type: 'personal', type_id: userId });
    }
    /** Get storage quota for a channel or conversation */
    async getQuota(type, typeId) {
        const data = this.api.createAuthenticatedRequestData({ type, type_id: typeId });
        try {
            const response = await this.api.post('/file/quota', data);
            return response.quota;
        }
        catch (error) {
            throw new Error(`Failed to get quota: ${error instanceof Error ? error.message : error}`);
        }
    }
    /** Delete one or more files */
    async deleteFiles(fileIds) {
        const data = this.api.createAuthenticatedRequestData({ file_ids: fileIds });
        try {
            await this.api.post('/file/delete', data);
        }
        catch (error) {
            throw new Error(`Failed to delete files: ${error instanceof Error ? error.message : error}`);
        }
    }
    /** Delete a folder */
    async deleteFolder(folderId) {
        const data = this.api.createAuthenticatedRequestData({ folder_id: String(folderId) });
        try {
            await this.api.post('/folder/delete', data);
        }
        catch (error) {
            throw new Error(`Failed to delete folder: ${error instanceof Error ? error.message : error}`);
        }
    }
    /** Rename a file */
    async renameFile(fileId, name) {
        const data = this.api.createAuthenticatedRequestData({ file_id: fileId, name });
        try {
            await this.api.post('/file/rename', data);
        }
        catch (error) {
            throw new Error(`Failed to rename file: ${error instanceof Error ? error.message : error}`);
        }
    }
    /** Move a file to a different folder */
    async moveFile(fileId, parentId) {
        const data = this.api.createAuthenticatedRequestData({ file_id: fileId, parent_id: parentId });
        try {
            await this.api.post('/file/move', data);
        }
        catch (error) {
            throw new Error(`Failed to move file: ${error instanceof Error ? error.message : error}`);
        }
    }
    /** Copy a file to a folder in a channel or conversation */
    async copyFile(fileId, folderId, type, typeId) {
        const data = this.api.createAuthenticatedRequestData({
            file_id: fileId,
            folder_id: String(folderId),
            type,
            type_id: typeId,
        });
        try {
            await this.api.post('/file/copy', data);
        }
        catch (error) {
            throw new Error(`Failed to copy file: ${error instanceof Error ? error.message : error}`);
        }
    }
    /** Create a new folder */
    async createFolder(name, parentId, type, typeId) {
        const data = this.api.createAuthenticatedRequestData({
            folder_name: name,
            parent_id: parentId,
            type,
            type_id: typeId,
        });
        try {
            const response = await this.api.post('/folder/create', data);
            return response.folder;
        }
        catch (error) {
            throw new Error(`Failed to create folder: ${error instanceof Error ? error.message : error}`);
        }
    }
    /**
     * Upload a file using Stashcat's resumable upload API.
     * Flow: 1) create_upload_context → 2) upload chunks → 3) return file info
     *
     * @param filePath Absolute or relative path to the file on disk
     * @param uploadOptions Target channel/conversation and optional encryption settings
     * @param chunkSize Chunk size in bytes (default 5 MB to match Stashcat)
     */
    async uploadFile(filePath, uploadOptions, chunkSize = 5 * 1024 * 1024) {
        const filename = uploadOptions.filename || path.basename(filePath);
        const stats = fs.statSync(filePath);
        const totalSize = stats.size;
        const totalChunks = Math.ceil(totalSize / chunkSize);
        // Step 1: Create upload context
        const contextData = this.api.createAuthenticatedRequestData({
            filename: filename,
            mime: this.guessMimeType(filename),
            filesize: totalSize,
            num_total_chunks: totalChunks,
            chunk_size: chunkSize,
            folder_type: uploadOptions.type,
            folder_type_id: uploadOptions.type_id ?? '',
            ...(uploadOptions.folder ? { folder_id: uploadOptions.folder } : {}),
        });
        const contextRes = await this.api.post('/file/create_upload_context', contextData);
        const identifier = contextRes.identifier;
        // Step 2: Upload chunks
        const fileStream = fs.readFileSync(filePath);
        let lastResponse;
        for (let chunkNumber = 1; chunkNumber <= totalChunks; chunkNumber++) {
            const start = (chunkNumber - 1) * chunkSize;
            const end = Math.min(start + chunkSize, totalSize);
            const chunk = fileStream.slice(start, end);
            const currentChunkSize = end - start;
            const formData = new FormData();
            // Resumable.js-compatible fields (using server-provided identifier)
            formData.append('resumableChunkNumber', String(chunkNumber));
            formData.append('resumableChunkSize', String(chunkSize));
            formData.append('resumableCurrentChunkSize', String(currentChunkSize));
            formData.append('resumableTotalSize', String(totalSize));
            formData.append('resumableType', this.guessMimeType(filename));
            formData.append('resumableIdentifier', identifier);
            formData.append('resumableFilename', filename);
            formData.append('resumableRelativePath', filename);
            formData.append('resumableTotalChunks', String(totalChunks));
            // Target context
            formData.append('folder_type', uploadOptions.type);
            formData.append('folder_type_id', uploadOptions.type_id ?? '');
            if (uploadOptions.folder)
                formData.append('folder_id', String(uploadOptions.folder));
            // Auth
            formData.append('client_key', this.api.getClientKey() || '');
            formData.append('device_id', this.api.getDeviceId());
            // File chunk
            const blob = new Blob([chunk], { type: this.guessMimeType(filename) });
            formData.append('file', blob, filename);
            try {
                const baseUrl = this.api.getBaseUrl();
                const url = baseUrl.endsWith('/') ? `${baseUrl}file/upload` : `${baseUrl}/file/upload`;
                const res = await axios_1.default.post(url, formData, {
                    headers: { Accept: 'application/json' },
                    timeout: 60000,
                    maxBodyLength: Infinity,
                    maxContentLength: Infinity,
                });
                if (res.data?.payload?.file) {
                    lastResponse = res.data.payload.file;
                }
                else if (res.data?.status?.value !== 'OK') {
                    throw new Error(`API error: ${res.data?.status?.short_message || 'Unknown error'}`);
                }
            }
            catch (error) {
                throw new Error(`Failed to upload chunk ${chunkNumber}/${totalChunks}: ${error instanceof Error ? error.message : error}`);
            }
        }
        if (!lastResponse) {
            throw new Error('Upload completed but no file info was returned');
        }
        return lastResponse;
    }
    guessMimeType(filename) {
        const ext = path.extname(filename).toLowerCase();
        const mimeTypes = {
            '.jpg': 'image/jpeg',
            '.jpeg': 'image/jpeg',
            '.png': 'image/png',
            '.gif': 'image/gif',
            '.webp': 'image/webp',
            '.pdf': 'application/pdf',
            '.doc': 'application/msword',
            '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            '.xls': 'application/vnd.ms-excel',
            '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            '.ppt': 'application/vnd.ms-powerpoint',
            '.pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
            '.txt': 'text/plain',
            '.mp4': 'video/mp4',
            '.mp3': 'audio/mpeg',
            '.zip': 'application/zip',
        };
        return mimeTypes[ext] || 'application/octet-stream';
    }
}
exports.FileManager = FileManager;
//# sourceMappingURL=files.js.map