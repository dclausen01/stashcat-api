import { StashcatAPI } from '../api/request';
import { Message, File } from './types';
import { CryptoManager } from '../encryption/crypto';

interface MessagesResponse {
  messages: Message[];
}

interface FileDownloadResponse {
  data: string;
}

export interface SendMessageOptions {
  /** Target ID (channel or conversation ID) */
  target: string;
  /** 'channel' or 'conversation' */
  target_type: 'channel' | 'conversation';
  text: string;
  /** File IDs to attach */
  files?: string[];
  /** URL to embed */
  url?: string;
  /** Whether the message is AES-encrypted */
  encrypted?: boolean;
  /** IV for encrypted message (hex) */
  iv?: string;
  /** Latitude for location messages */
  latitude?: number;
  /** Longitude for location messages */
  longitude?: number;
  /** Signature/verification for E2E */
  verification?: string;
  is_forwarded?: boolean;
}

export class MessageManager {
  constructor(private api: StashcatAPI) {}

  /** Get messages from a channel or conversation */
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

      if (options.key) {
        messages = messages.map((message: Message) => {
          const decryptedMessage = { ...message };
          if (message.encrypted && message.text) {
            try {
              const iv = message.iv ? CryptoManager.hexToBuffer(message.iv) : undefined;
              decryptedMessage.text = CryptoManager.decrypt(
                message.text,
                options.key!,
                iv || CryptoManager.generateKey().iv
              );
              decryptedMessage.original_text = message.text;
            } catch (err) {
              console.warn(`Failed to decrypt message ${message.id}:`, err);
            }
          }
          return decryptedMessage;
        });
      }

      return messages;
    } catch (error) {
      throw new Error(`Failed to get messages: ${error instanceof Error ? error.message : error}`);
    }
  }

  /** Send a message to a channel or conversation */
  async sendMessage(options: SendMessageOptions): Promise<Message> {
    const request = this.api.createAuthenticatedRequestData({
      target: options.target,
      target_type: options.target_type,
      text: options.text,
      files: options.files,
      url: options.url,
      encrypted: options.encrypted,
      iv: options.iv,
      latitude: options.latitude,
      longitude: options.longitude,
      verification: options.verification,
      is_forwarded: options.is_forwarded,
    });

    try {
      const response = await this.api.post<{ message: Message }>('/message/send', request);
      return response.message;
    } catch (error) {
      throw new Error(`Failed to send message: ${error instanceof Error ? error.message : error}`);
    }
  }

  /** Delete a message by ID */
  async deleteMessage(messageId: string): Promise<void> {
    const request = this.api.createAuthenticatedRequestData({ message_id: messageId });
    try {
      await this.api.post('/message/delete', request);
    } catch (error) {
      throw new Error(`Failed to delete message: ${error instanceof Error ? error.message : error}`);
    }
  }

  /** Like a message */
  async likeMessage(messageId: string): Promise<void> {
    const request = this.api.createAuthenticatedRequestData({ message_id: messageId });
    try {
      await this.api.post('/message/like', request);
    } catch (error) {
      throw new Error(`Failed to like message: ${error instanceof Error ? error.message : error}`);
    }
  }

  /** Unlike a message */
  async unlikeMessage(messageId: string): Promise<void> {
    const request = this.api.createAuthenticatedRequestData({ message_id: messageId });
    try {
      await this.api.post('/message/unlike', request);
    } catch (error) {
      throw new Error(`Failed to unlike message: ${error instanceof Error ? error.message : error}`);
    }
  }

  /** Flag a message */
  async flagMessage(messageId: string): Promise<void> {
    const request = this.api.createAuthenticatedRequestData({ message_id: messageId });
    try {
      await this.api.post('/message/flag', request);
    } catch (error) {
      throw new Error(`Failed to flag message: ${error instanceof Error ? error.message : error}`);
    }
  }

  /** Unflag a message */
  async unflagMessage(messageId: string): Promise<void> {
    const request = this.api.createAuthenticatedRequestData({ message_id: messageId });
    try {
      await this.api.post('/message/unflag', request);
    } catch (error) {
      throw new Error(`Failed to unflag message: ${error instanceof Error ? error.message : error}`);
    }
  }

  /** Get flagged messages in a channel or conversation */
  async getFlaggedMessages(
    type: 'channel' | 'conversation',
    typeId: string,
    options: { limit?: number; offset?: number } = {}
  ): Promise<Message[]> {
    const request = this.api.createAuthenticatedRequestData({
      type,
      type_id: typeId,
      limit: options.limit || 50,
      offset: options.offset || 0,
    });
    try {
      const response = await this.api.post<MessagesResponse>('/message/list_flagged_messages', request);
      return response.messages || [];
    } catch (error) {
      throw new Error(`Failed to get flagged messages: ${error instanceof Error ? error.message : error}`);
    }
  }

  /** Download a file, optionally decrypting it */
  async downloadFile(file: File, key?: Buffer): Promise<Buffer> {
    const request = this.api.createAuthenticatedRequestData({ id: file.id });

    try {
      const response = await this.api.post<FileDownloadResponse>('/file/download', request);
      const rawData = Buffer.from(response.data || '', 'base64');

      if (file.encrypted && key) {
        const iv = file.e2e_iv ? CryptoManager.hexToBuffer(file.e2e_iv) : undefined;
        return Buffer.from(
          CryptoManager.decrypt(response.data, key, iv || CryptoManager.generateKey().iv),
          'hex'
        );
      }

      return rawData;
    } catch (error) {
      throw new Error(`Failed to download file: ${error instanceof Error ? error.message : error}`);
    }
  }
}
