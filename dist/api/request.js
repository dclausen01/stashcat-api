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
exports.StashcatAPI = void 0;
const axios_1 = __importDefault(require("axios"));
const crypto = __importStar(require("crypto"));
class StashcatAPI {
    constructor(config = {}) {
        this.config = {
            baseUrl: config.baseUrl || 'https://api.stashcat.com/',
            deviceId: config.deviceId || this.generateDeviceId(),
            userAgent: config.userAgent || 'stashcat-api-client/1.0.0',
        };
        this.client = axios_1.default.create({
            baseURL: this.config.baseUrl,
            headers: {
                'Accept': 'application/json',
                'User-Agent': this.config.userAgent,
            },
            timeout: 30000,
        });
    }
    generateDeviceId() {
        return crypto.randomBytes(16).toString('hex');
    }
    buildUrl(path) {
        const baseUrl = this.config.baseUrl.endsWith('/')
            ? this.config.baseUrl.slice(0, -1)
            : this.config.baseUrl;
        const cleanPath = path.startsWith('/') ? path.slice(1) : path;
        return `${baseUrl}/${cleanPath}`;
    }
    async post(path, data) {
        try {
            const response = await this.client.post(this.buildUrl(path), data, {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
            });
            if (response.data.status.value !== 'OK') {
                throw new Error(`API Error: ${response.data.status.short_message} - ${response.data.status.message}`);
            }
            return response.data.payload;
        }
        catch (error) {
            if (axios_1.default.isAxiosError(error)) {
                throw new Error(`Request failed: ${error.message}`);
            }
            throw error;
        }
    }
    getDeviceId() {
        return this.config.deviceId;
    }
    setClientKey(clientKey) {
        this.clientKey = clientKey;
    }
    getClientKey() {
        return this.clientKey;
    }
    getBaseUrl() {
        return this.config.baseUrl || 'https://api.stashcat.com/';
    }
    /**
     * Download a file as raw binary Buffer.
     * The file ID is passed as a query parameter (?id=), auth goes in the POST body.
     */
    async downloadBinary(fileId) {
        const params = new URLSearchParams({
            client_key: this.clientKey || '',
            device_id: this.config.deviceId || '',
        });
        try {
            const response = await this.client.post(this.buildUrl(`/file/download?id=${encodeURIComponent(fileId)}`), params.toString(), {
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                responseType: 'arraybuffer',
            });
            return Buffer.from(response.data);
        }
        catch (error) {
            if (axios_1.default.isAxiosError(error)) {
                throw new Error(`Download failed: ${error.message}`);
            }
            throw error;
        }
    }
    /**
     * Create authenticated request data by automatically adding client_key and device_id
     */
    createAuthenticatedRequestData(additionalData) {
        const baseData = {
            client_key: this.clientKey,
            device_id: this.config.deviceId,
            ...additionalData,
        };
        // Remove undefined values
        for (const key of Object.keys(baseData)) {
            if (baseData[key] === undefined) {
                delete baseData[key];
            }
        }
        return baseData;
    }
}
exports.StashcatAPI = StashcatAPI;
//# sourceMappingURL=request.js.map