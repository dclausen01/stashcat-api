import { StashcatAPI } from '../api/request';
import { Message, MessageLiker } from './types';
import { CryptoManager } from '../encryption/crypto';

interface MessagesResponse {
  messages: Message[];
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
  /** Reply to a specific message ID */
  reply_to_id?: string;
}

export class MessageManager {
  constructor(private api: StashcatAPI) {}

  /** Get messages from a channel or conversation */
  async getMessages(
    id: string,
    chatType: 'channel' | 'conversation',
    options: { limit?: number; offset?: number; after_message_id?: string; key?: Buffer } = {}
  ): Promise<Message[]> {
    const sourceIdKey = chatType === 'conversation' ? 'conversation_id' : 'channel_id';
    const request = this.api.createAuthenticatedRequestData({
      [sourceIdKey]: id,
      source: chatType,
      limit: options.limit || 50,
      offset: options.offset || 0,
      after_message_id: options.after_message_id,
    });

    try {
      const response = await this.api.post<MessagesResponse>('/message/content', request);
      let messages = response.messages || [];

      if (options.key) {
        messages = messages.map((message: Message) => {
          const decryptedMessage = { ...message };
          if (message.encrypted && message.text) {
            if (!message.iv) {
              throw new Error(`Cannot decrypt message ${message.id}: missing IV`);
            }
            try {
              const iv = CryptoManager.hexToBuffer(message.iv);
              decryptedMessage.text = CryptoManager.decrypt(
                message.text,
                options.key!,
                iv
              );
              decryptedMessage.original_text = message.text;
            } catch {
              // Decryption failed — leave original text intact
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
    const targetIdKey = options.target_type === 'conversation' ? 'conversation_id' : 'channel_id';
    const requestData: Record<string, unknown> = {
      target: options.target_type,
      [targetIdKey]: options.target,
      text: options.text,
      // Die API erwartet files als JSON-String ("[\"id1\",\"id2\"]"), kein Axios-Array
      files: options.files ? JSON.stringify(options.files) : undefined,
      url: options.url,
      encrypted: options.encrypted,
      iv: options.iv,
      latitude: options.latitude,
      longitude: options.longitude,
      verification: options.verification,
      is_forwarded: options.is_forwarded,
      reply_to_id: options.reply_to_id ? Number(options.reply_to_id) : undefined,
      // DEBUG: Also send as reply_to (some APIs use this field name)
      reply_to: options.reply_to_id ? Number(options.reply_to_id) : undefined,
    };
    const request = this.api.createAuthenticatedRequestData(requestData);

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

  /**
   * Mark messages as read up to (and including) the given message ID.
   * Pass the ID of the newest visible message to mark all previous as read.
   */
  async markAsRead(
    id: string,
    chatType: 'channel' | 'conversation',
    messageId: string
  ): Promise<void> {
    const sourceIdKey = chatType === 'conversation' ? 'conversation_id' : 'channel_id';
    const request = this.api.createAuthenticatedRequestData({
      [sourceIdKey]: id,
      message_id: messageId,
    });
    try {
      await this.api.post('/message/mark_read', request);
    } catch (error) {
      throw new Error(`Failed to mark as read: ${error instanceof Error ? error.message : error}`);
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

  /** List users who liked a message */
  async listLikes(messageId: string): Promise<MessageLiker[]> {
    const request = this.api.createAuthenticatedRequestData({ message_id: messageId });
    try {
      const payload = await this.api.post<{ likes: MessageLiker[] }>('/message/list_likes', request);
      return payload.likes || [];
    } catch (error) {
      throw new Error(`Failed to list likes: ${error instanceof Error ? error.message : error}`);
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

  /** Download a file as a Buffer, optionally decrypting E2E-encrypted content */
  async downloadFile(file: { id: string; encrypted?: boolean; e2e_iv?: string | null }, key?: Buffer): Promise<Buffer> {
    try {
      // API returns raw binary — file ID goes as ?id= query param, auth in POST body
      const rawData = await this.api.downloadBinary(file.id);

      if (file.encrypted && key) {
        if (!file.e2e_iv) {
          throw new Error(`Cannot decrypt file ${file.id}: missing e2e_iv`);
        }
        const iv = CryptoManager.hexToBuffer(file.e2e_iv);
        const decrypted = CryptoManager.decrypt(rawData.toString('hex'), key, iv);
        return Buffer.from(decrypted, 'hex');
      }

      return rawData;
    } catch (error) {
      throw new Error(`Failed to download file: ${error instanceof Error ? error.message : error}`);
    }
  }
}
