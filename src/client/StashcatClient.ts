import { StashcatAPI, StashcatConfig } from '../api/request';
import { AuthManager } from '../auth/login';
import { AuthConfig } from '../auth/types';
import { ChannelManager, CreateChannelOptions, EditChannelOptions, ChannelMembersOptions } from '../chats/channels';
import { ConversationManager } from '../chats/conversations';
import { MessageManager, SendMessageOptions } from '../chats/messages';
import { Channel, ChannelMember, Conversation, Message, File, PaginationOptions } from '../chats/types';
import { CryptoManager, EncryptionKey } from '../encryption/crypto';
import { UserManager } from '../users/users';
import { User, CompanyMember } from '../users/types';
import { AccountManager } from '../account/account';
import { AccountSettings, ActiveDevice, Notification } from '../account/types';
import { FileManager } from '../files/files';
import { FileInfo, FolderContent, FolderListOptions, FileUploadOptions, FileQuota } from '../files/types';
import { SecurityManager, PrivateKeyResponse } from '../security/security';
import { RealtimeManager } from '../realtime/realtime';
import { RealtimeManagerOptions } from '../realtime/types';

export interface StashcatClientConfig extends StashcatConfig {
  email?: string;
  password?: string;
  appName?: string;
}

/** Serialized session state for persistence between requests (e.g. Nextcloud plugin) */
export interface SerializedSession {
  deviceId: string;
  clientKey: string;
  /** AES encryption key as hex string */
  encryptionKeyHex?: string;
  /** AES IV as hex string */
  encryptionIvHex?: string;
  /** Base URL of the Stashcat instance */
  baseUrl?: string;
}

export class StashcatClient {
  private api: StashcatAPI;
  private auth: AuthManager;
  private channels: ChannelManager;
  private conversations: ConversationManager;
  private messages: MessageManager;
  private users: UserManager;
  private account: AccountManager;
  private files: FileManager;
  private security: SecurityManager;
  private encryptionKey?: EncryptionKey;

  constructor(config: StashcatClientConfig = {}) {
    this.api = new StashcatAPI(config);
    this.auth = new AuthManager(this.api, config.deviceId);
    this.channels = new ChannelManager(this.api);
    this.conversations = new ConversationManager(this.api);
    this.messages = new MessageManager(this.api);
    this.users = new UserManager(this.api);
    this.account = new AccountManager(this.api);
    this.files = new FileManager(this.api);
    this.security = new SecurityManager(this.api);
  }

  // ─── Auth ────────────────────────────────────────────────────────────────

  async login(config: AuthConfig): Promise<void> {
    await this.auth.login(config);
    this.encryptionKey = CryptoManager.generateKey();
  }

  logout(): void {
    this.auth.logout();
    this.encryptionKey = undefined;
  }

  /**
   * Serialize the current session to a plain object that can be stored
   * (e.g. in a Nextcloud database) and restored later without re-login.
   */
  serialize(): SerializedSession {
    if (!this.isAuthenticated()) {
      throw new Error('Cannot serialize: not authenticated.');
    }
    const clientKey = this.auth.getClientKey();
    if (!clientKey) {
      throw new Error('Cannot serialize: client_key missing.');
    }
    return {
      deviceId: this.api.getDeviceId(),
      clientKey,
      encryptionKeyHex: this.encryptionKey?.key.toString('hex'),
      encryptionIvHex: this.encryptionKey?.iv.toString('hex'),
      baseUrl: undefined, // consumer can add this if needed
    };
  }

  /**
   * Restore a previously serialized session without performing a new login.
   * Use this in Nextcloud plugins to reuse an existing session across requests.
   *
   * @example
   * const session = JSON.parse(await db.get('stashcat_session'));
   * const client = StashcatClient.fromSession(session);
   * await client.getConversations();
   */
  static fromSession(session: SerializedSession, config: StashcatClientConfig = {}): StashcatClient {
    const client = new StashcatClient({
      ...config,
      baseUrl: session.baseUrl || config.baseUrl,
      deviceId: session.deviceId,
    });
    client.auth.restoreSession(session.clientKey);
    if (session.encryptionKeyHex && session.encryptionIvHex) {
      client.encryptionKey = {
        key: Buffer.from(session.encryptionKeyHex, 'hex'),
        iv: Buffer.from(session.encryptionIvHex, 'hex'),
      };
    }
    return client;
  }

  isAuthenticated(): boolean {
    return this.auth.isAuthenticated();
  }

  getEncryptionKey(): EncryptionKey | undefined {
    return this.encryptionKey;
  }

  getClientInfo() {
    return {
      deviceId: this.api.getDeviceId(),
      isAuthenticated: this.isAuthenticated(),
      hasEncryptionKey: !!this.encryptionKey,
    };
  }

  // ─── Users ───────────────────────────────────────────────────────────────

  async getMe(): Promise<User> {
    this.requireAuth();
    return this.users.getMe();
  }

  async getUserInfo(userId: string, withKey = true): Promise<User> {
    this.requireAuth();
    return this.users.getUserInfo(userId, withKey);
  }

  async getCompanyMembers(companyId: string, noCache = false): Promise<CompanyMember[]> {
    this.requireAuth();
    return this.users.getCompanyMembers(companyId, noCache);
  }

  // ─── Channels ────────────────────────────────────────────────────────────

  async getChannels(companyId: string): Promise<Channel[]> {
    this.requireAuth();
    return this.channels.getChannels(companyId);
  }

  async getVisibleChannels(companyId: string, options: { limit?: number; offset?: number; search?: string } = {}): Promise<Channel[]> {
    this.requireAuth();
    return this.channels.getVisibleChannels(companyId, options);
  }

  async getChannelInfo(channelId: string, withoutMembers = false): Promise<Channel> {
    this.requireAuth();
    return this.channels.getChannelInfo(channelId, withoutMembers);
  }

  async createChannel(options: CreateChannelOptions): Promise<Channel> {
    this.requireAuth();
    return this.channels.createChannel(options);
  }

  async editChannel(options: EditChannelOptions): Promise<Channel> {
    this.requireAuth();
    return this.channels.editChannel(options);
  }

  async deleteChannel(channelId: string): Promise<void> {
    this.requireAuth();
    return this.channels.deleteChannel(channelId);
  }

  async joinChannel(channelId: string, password?: string): Promise<void> {
    this.requireAuth();
    return this.channels.joinChannel(channelId, password);
  }

  async quitChannel(channelId: string): Promise<void> {
    this.requireAuth();
    return this.channels.quitChannel(channelId);
  }

  async inviteUsersToChannel(channelId: string, userIds: string[], text?: string): Promise<void> {
    this.requireAuth();
    return this.channels.inviteUsers(channelId, userIds, text);
  }

  async getChannelMembers(channelId: string, options: ChannelMembersOptions = {}): Promise<ChannelMember[]> {
    this.requireAuth();
    return this.channels.getChannelMembers(channelId, options);
  }

  async removeUserFromChannel(channelId: string, userId: string): Promise<void> {
    this.requireAuth();
    return this.channels.removeUser(channelId, userId);
  }

  async addChannelModerator(channelId: string, userId: string): Promise<void> {
    this.requireAuth();
    return this.channels.addModeratorStatus(channelId, userId);
  }

  async removeChannelModerator(channelId: string, userId: string): Promise<void> {
    this.requireAuth();
    return this.channels.removeModeratorStatus(channelId, userId);
  }

  async acceptChannelInvite(inviteId: string): Promise<void> {
    this.requireAuth();
    return this.channels.acceptInvite(inviteId);
  }

  async declineChannelInvite(inviteId: string): Promise<void> {
    this.requireAuth();
    return this.channels.declineInvite(inviteId);
  }

  // ─── Conversations ───────────────────────────────────────────────────────

  async getConversations(options: PaginationOptions = {}): Promise<Conversation[]> {
    this.requireAuth();
    return this.conversations.getConversations(options);
  }

  async getConversation(conversationId: string): Promise<Conversation> {
    this.requireAuth();
    return this.conversations.getConversation(conversationId);
  }

  async createEncryptedConversation(memberIds: string[], uniqueIdentifier: string): Promise<Conversation> {
    this.requireAuth();
    return this.conversations.createEncryptedConversation(memberIds, uniqueIdentifier);
  }

  async archiveConversation(conversationId: string): Promise<void> {
    this.requireAuth();
    return this.conversations.archiveConversation(conversationId);
  }

  async setConversationFavorite(conversationId: string, favorite: boolean): Promise<void> {
    this.requireAuth();
    return this.conversations.setFavorite(conversationId, favorite);
  }

  // ─── Messages ────────────────────────────────────────────────────────────

  async getMessages(
    id: string,
    chatType: 'channel' | 'conversation',
    options: { limit?: number; offset?: number; after_message_id?: string } = {}
  ): Promise<Message[]> {
    this.requireAuth();
    return this.messages.getMessages(id, chatType, {
      ...options,
      key: this.encryptionKey?.key,
    });
  }

  async sendMessage(options: SendMessageOptions): Promise<Message> {
    this.requireAuth();
    return this.messages.sendMessage(options);
  }

  async deleteMessage(messageId: string): Promise<void> {
    this.requireAuth();
    return this.messages.deleteMessage(messageId);
  }

  async markAsRead(
    id: string,
    chatType: 'channel' | 'conversation',
    messageId: string
  ): Promise<void> {
    this.requireAuth();
    return this.messages.markAsRead(id, chatType, messageId);
  }

  async likeMessage(messageId: string): Promise<void> {
    this.requireAuth();
    return this.messages.likeMessage(messageId);
  }

  async unlikeMessage(messageId: string): Promise<void> {
    this.requireAuth();
    return this.messages.unlikeMessage(messageId);
  }

  async flagMessage(messageId: string): Promise<void> {
    this.requireAuth();
    return this.messages.flagMessage(messageId);
  }

  async unflagMessage(messageId: string): Promise<void> {
    this.requireAuth();
    return this.messages.unflagMessage(messageId);
  }

  async getFlaggedMessages(
    type: 'channel' | 'conversation',
    typeId: string,
    options: { limit?: number; offset?: number } = {}
  ): Promise<Message[]> {
    this.requireAuth();
    return this.messages.getFlaggedMessages(type, typeId, options);
  }

  // ─── Files ───────────────────────────────────────────────────────────────

  async downloadFile(file: { id: string; encrypted?: boolean; e2e_iv?: string | null }, key?: Buffer): Promise<Buffer> {
    this.requireAuth();
    return this.messages.downloadFile(file, key || this.encryptionKey?.key);
  }

  async uploadFile(filePath: string, uploadOptions: FileUploadOptions, chunkSize?: number): Promise<FileInfo> {
    this.requireAuth();
    return this.files.uploadFile(filePath, uploadOptions, chunkSize);
  }

  async getFileInfo(fileId: string): Promise<FileInfo> {
    this.requireAuth();
    return this.files.getFileInfo(fileId);
  }

  async listFolder(options: FolderListOptions = {}): Promise<FolderContent> {
    this.requireAuth();
    return this.files.listFolder(options);
  }

  /** Listet die persönliche Ablage des eingeloggten Nutzers ("Meine Dateien") */
  async listPersonalFiles(options: Omit<FolderListOptions, 'type' | 'type_id'> = {}): Promise<FolderContent> {
    this.requireAuth();
    const me = await this.users.getMe();
    return this.files.listPersonalFiles(me.id, options);
  }

  async deleteFiles(fileIds: string[]): Promise<void> {
    this.requireAuth();
    return this.files.deleteFiles(fileIds);
  }

  async renameFile(fileId: string, name: string): Promise<void> {
    this.requireAuth();
    return this.files.renameFile(fileId, name);
  }

  async moveFile(fileId: string, parentId: string): Promise<void> {
    this.requireAuth();
    return this.files.moveFile(fileId, parentId);
  }

  async getStorageQuota(type: string, typeId: string): Promise<FileQuota> {
    this.requireAuth();
    return this.files.getQuota(type, typeId);
  }

  // ─── Account ─────────────────────────────────────────────────────────────

  async changeStatus(status: string): Promise<void> {
    this.requireAuth();
    return this.account.changeStatus(status);
  }

  async changePassword(oldPassword: string, newPassword: string): Promise<void> {
    this.requireAuth();
    return this.account.changePassword(oldPassword, newPassword);
  }

  async getAccountSettings(): Promise<AccountSettings> {
    this.requireAuth();
    return this.account.getSettings();
  }

  async listActiveDevices(): Promise<ActiveDevice[]> {
    this.requireAuth();
    return this.account.listActiveDevices();
  }

  async deactivateDevice(deviceId: string): Promise<void> {
    this.requireAuth();
    return this.account.deactivateDevice(deviceId);
  }

  async storeProfileImage(imgBase64: string): Promise<void> {
    this.requireAuth();
    return this.account.storeProfileImage(imgBase64);
  }

  async getNotifications(limit?: number, offset?: number): Promise<Notification[]> {
    this.requireAuth();
    return this.account.getNotifications(limit, offset);
  }

  async getNotificationCount(): Promise<number> {
    this.requireAuth();
    return this.account.getNotificationCount();
  }

  // ─── Security ────────────────────────────────────────────────────────────

  async getPrivateKey(): Promise<PrivateKeyResponse> {
    this.requireAuth();
    return this.security.getPrivateKey();
  }

  // ─── Realtime ─────────────────────────────────────────────────────────────

  /**
   * Erstellt einen RealtimeManager für Push-Events via Socket.io.
   * Holt automatisch die `socket_id` (hidden_id) des Users für den Auth-Handshake.
   * Die Verbindung wird NICHT automatisch aufgebaut — rufe `rt.connect()` auf.
   *
   * Auth-Flow: nach connect → emit('userid', { hidden_id: socket_id, device_id, client_key })
   *
   * @example
   * const rt = await client.createRealtimeManager({ debug: true });
   * await rt.connect();
   * rt.on('message_sync', (data) => console.log('Neue Nachricht!', data));
   * rt.on('new_device_connected', () => console.log('Auth OK!'));
   */
  async createRealtimeManager(options: RealtimeManagerOptions = {}): Promise<RealtimeManager> {
    this.requireAuth();
    const clientKey = this.auth.getClientKey();
    const deviceId = this.api.getDeviceId();
    if (!clientKey) throw new Error('Kein client_key — bitte erst einloggen.');

    // socket_id (= hidden_id für Auth-Emit) aus /users/me laden
    const me = await this.users.getMe();
    const hiddenId = me.socket_id ?? '';

    return new RealtimeManager(clientKey, deviceId, hiddenId, options);
  }

  // ─── Internal ────────────────────────────────────────────────────────────

  private requireAuth(): void {
    if (!this.isAuthenticated()) {
      throw new Error('Not authenticated. Please login first.');
    }
  }
}

