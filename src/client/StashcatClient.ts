import { StashcatAPI, StashcatConfig } from '../api/request';
import { AuthManager } from '../auth/login';
import { AuthConfig } from '../auth/types';
import { ChannelManager } from '../chats/channels';
import { ConversationManager } from '../chats/conversations';
import { MessageManager } from '../chats/messages';
import { Channel, Conversation, Message, PaginationOptions } from '../chats/types';
import { CryptoManager, EncryptionKey } from '../encryption/crypto';

export interface StashcatClientConfig extends StashcatConfig {
  email?: string;
  password?: string;
  appName?: string;
}

export class StashcatClient {
  private api: StashcatAPI;
  private auth: AuthManager;
  private channels: ChannelManager;
  private conversations: ConversationManager;
  private messages: MessageManager;
  private encryptionKey?: EncryptionKey;

  constructor(config: StashcatClientConfig = {}) {
    this.api = new StashcatAPI(config);
    this.auth = new AuthManager(this.api, config.deviceId);
    this.channels = new ChannelManager(this.api);
    this.conversations = new ConversationManager(this.api);
    this.messages = new MessageManager(this.api);
  }

  /**
   * Authenticate with Stashcat API
   */
  async login(config: AuthConfig): Promise<void> {
    await this.auth.login(config);
    
    // Generate encryption key for message encryption/decryption
    this.encryptionKey = CryptoManager.generateKey();
  }

  /**
   * Logout and clear session
   */
  logout(): void {
    this.auth.logout();
    this.encryptionKey = undefined;
  }

  /**
   * Check if authenticated
   */
  isAuthenticated(): boolean {
    return this.auth.isAuthenticated();
  }

  /**
   * Get current encryption key
   */
  getEncryptionKey(): EncryptionKey | undefined {
    return this.encryptionKey;
  }

  /**
   * Channel operations
   */
  async getChannels(companyId: string): Promise<Channel[]> {
    if (!this.isAuthenticated()) {
      throw new Error('Not authenticated. Please login first.');
    }
    return this.channels.getChannels(companyId);
  }

  /**
   * Conversation operations
   */
  async getConversations(options: PaginationOptions = {}): Promise<Conversation[]> {
    if (!this.isAuthenticated()) {
      throw new Error('Not authenticated. Please login first.');
    }
    return this.conversations.getConversations(options);
  }

  /**
   * Message operations
   */
  async getMessages(
    id: string, 
    chatType: 'channel' | 'conversation', 
    options: { limit?: number; offset?: number } = {}
  ): Promise<Message[]> {
    if (!this.isAuthenticated()) {
      throw new Error('Not authenticated. Please login first.');
    }
    
    return this.messages.getMessages(id, chatType, {
      ...options,
      key: this.encryptionKey?.key,
    });
  }

  /**
   * File operations
   */
  async downloadFile(file: any, key?: Buffer): Promise<Buffer> {
    if (!this.isAuthenticated()) {
      throw new Error('Not authenticated. Please login first.');
    }
    
    return this.messages.downloadFile(file, key || this.encryptionKey?.key);
  }

  /**
   * Get client information
   */
  getClientInfo() {
    return {
      deviceId: this.api.getDeviceId(),
      isAuthenticated: this.isAuthenticated(),
      hasEncryptionKey: !!this.encryptionKey,
    };
  }
}
