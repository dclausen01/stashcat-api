import { StashcatAPI } from '../api/request';
import { Message, ChatType, File } from './types';
import { CryptoManager } from '../encryption/crypto';

interface MessagesResponse {
  messages: Message[];
}

interface FileDownloadResponse {
  data: string;
}

export class MessageManager {
  private api: StashcatAPI;

  constructor(api: StashcatAPI) {
    this.api = api;
  }

  async getMessages(
    id: string, 
    chatType: 'channel' | 'conversation', 
    options: { limit?: number; offset?: number; key?: Buffer } = {}
  ): Promise<Message[]> {
    const request = this.api.createAuthenticatedRequestData({
      id,
      type: chatType,
      limit: options.limit || 50,
      offset: options.offset || 0,
    });

    try {
      const response = await this.api.post<MessagesResponse>('/message/content', request);
      let messages = response.messages || [];

      // Decrypt messages if key is provided
      if (options.key) {
        messages = messages.map((message: Message) => {
          const decryptedMessage = { ...message };
          
          if (message.encrypted && message.text) {
            try {
              const iv = message.iv ? CryptoManager.hexToBuffer(message.iv) : undefined;
              const keyBuffer = options.key!;
              decryptedMessage.text = CryptoManager.decrypt(message.text, keyBuffer, iv || CryptoManager.generateKey().iv);
              decryptedMessage.original_text = message.text;
            } catch (error) {
              console.warn(`Failed to decrypt message ${message.id}:`, error);
            }
          }

          return decryptedMessage;
        });
      }

      return messages;
    } catch (error) {
      throw new Error(`Failed to get messages: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async downloadFile(file: File, key?: Buffer): Promise<Buffer> {
    const request = this.api.createAuthenticatedRequestData({
      id: file.id,
    });

    try {
      const response = await this.api.post<FileDownloadResponse>('/file/download', request);
      const rawData = Buffer.from(response.data || '', 'base64');

      // Decrypt file if it's encrypted and key is provided
      if (file.encrypted && key) {
        const iv = file.e2e_iv ? CryptoManager.hexToBuffer(file.e2e_iv) : undefined;
        return Buffer.from(CryptoManager.decrypt(response.data, key, iv || CryptoManager.generateKey().iv), 'hex');
      }

      return rawData;
    } catch (error) {
      throw new Error(`Failed to download file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}
