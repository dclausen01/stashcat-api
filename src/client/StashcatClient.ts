import { StashcatAPI, StashcatConfig } from '../api/request';
import { AuthManager } from '../auth/login';
import { AuthConfig, AuthState } from '../auth/types';
import { RsaPrivateKeyJwk, SigningKeyData } from '../encryption/types';
import { ChannelManager, CreateChannelOptions, EditChannelOptions, ChannelMembersOptions } from '../chats/channels';
import { ConversationManager } from '../chats/conversations';
import { MessageManager, SendMessageOptions } from '../chats/messages';
import { Channel, ChannelMember, Conversation, Message, MessageLiker, PaginationOptions } from '../chats/types';
import { UserManager } from '../users/users';
import { User, CompanyMember, ManagedUser, CompanyGroup } from '../users/types';
import { AccountManager } from '../account/account';
import { AccountSettings, ActiveDevice, Notification } from '../account/types';
import { FileManager } from '../files/files';
import { FileInfo, FolderContent, FolderListOptions, FileUploadOptions, FileQuota, FolderEntry } from '../files/types';
import { SecurityManager, PrivateKeyResponse } from '../security/security';
import { RealtimeManager } from '../realtime/realtime';
import { RealtimeManagerOptions } from '../realtime/types';
import { CalendarManager } from '../calendar/calendar';
import { CalendarEvent, CreateEventOptions, EditEventOptions, ListEventsOptions, EventInviteStatus, AvailableCalendar } from '../calendar/types';
import { BroadcastManager } from '../broadcast/broadcast';
import { Broadcast, BroadcastContentOptions, SendBroadcastOptions, BroadcastMemberSortField } from '../broadcast/types';
import { PollManager } from '../poll/poll';
import {
  Poll, PollListItem, PollQuestion, PollAnswer, PollUser,
  PollConstraint, PollInviteTarget,
  CreatePollOptions, EditPollOptions,
  CreateQuestionOptions, EditQuestionOptions,
  CreateAnswerOptions, EditAnswerOptions,
} from '../poll/types';

export interface StashcatClientConfig extends StashcatConfig {
  email?: string;
  password?: string;
  appName?: string;
}

/** Serialized session state for persistence between requests (e.g. Nextcloud plugin) */
export interface SerializedSession {
  deviceId: string;
  clientKey: string;
  /** Base URL of the Stashcat instance */
  baseUrl?: string;
}

export class StashcatClient {
  public api: StashcatAPI;
  private auth: AuthManager;
  private channels: ChannelManager;
  private conversations: ConversationManager;
  private messages: MessageManager;
  private users: UserManager;
  private account: AccountManager;
  private files: FileManager;
  private security: SecurityManager;
  private calendar: CalendarManager;
  private broadcast: BroadcastManager;
  private poll: PollManager;

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
    this.calendar = new CalendarManager(this.api);
    this.broadcast = new BroadcastManager(this.api);
    this.poll = new PollManager(this.api);
  }

  // ─── Auth ────────────────────────────────────────────────────────────────

  async login(config: AuthConfig): Promise<void> {
    await this.auth.login(config);
    // Auto-unlock E2E if security password provided
    if (config.securityPassword) {
      await this.security.unlockPrivateKey(config.securityPassword);
    }
  }

  logout(): void {
    this.auth.logout();
    this.security.clearKeyCache();
  }

  /**
   * Unlock E2E decryption explicitly.
   * Fetches the RSA private key from the server and decrypts it with the given password.
   * After this call, getMessages() for encrypted conversations returns plaintext.
   *
   * The security password may be identical to the login password (Stashcat default).
   */
  async unlockE2E(securityPassword: string): Promise<void> {
    this.requireAuth();
    await this.security.unlockPrivateKey(securityPassword);
  }

  /** Returns true if E2E decryption is unlocked. */
  isE2EUnlocked(): boolean {
    return this.security.isUnlocked();
  }

  /**
   * Serialize the current session to a plain object that can be stored
   * (e.g. in a Nextcloud database) and restored later without re-login.
   * Note: E2E unlock state is NOT serialized for security — call unlockE2E() again after restore.
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
      baseUrl: undefined, // consumer can add this if needed
    };
  }

  /**
   * Restore a previously serialized session without performing a new login.
   * Use this in Nextcloud plugins to reuse an existing session across requests.
   * Call unlockE2E(securityPassword) afterwards to re-enable E2E decryption.
   *
   * @example
   * const session = JSON.parse(await db.get('stashcat_session'));
   * const client = StashcatClient.fromSession(session);
   * await client.unlockE2E(securityPassword);
   * await client.getConversations();
   */
  static fromSession(session: SerializedSession, config: StashcatClientConfig = {}): StashcatClient {
    const client = new StashcatClient({
      ...config,
      baseUrl: session.baseUrl || config.baseUrl,
      deviceId: session.deviceId,
    });
    client.auth.restoreSession(session.clientKey);
    return client;
  }

  isAuthenticated(): boolean {
    return this.auth.isAuthenticated();
  }

  getClientInfo() {
    return {
      deviceId: this.api.getDeviceId(),
      isAuthenticated: this.isAuthenticated(),
      isE2EUnlocked: this.isE2EUnlocked(),
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

  async getCompanies(): Promise<import('../users/types').Company[]> {
    this.requireAuth();
    return this.users.getCompanies();
  }

  async getCompanyDetails(companyId: string): Promise<import('../users/types').Company> {
    this.requireAuth();
    return this.users.getCompanyDetails(companyId);
  }

  async getCompanyMembers(
    companyId: string,
    options?: { limit?: number; offset?: number; search?: string; noCache?: boolean } | boolean,
  ): Promise<CompanyMember[]> {
    this.requireAuth();
    return this.users.getCompanyMembers(companyId, options);
  }

  async getAllCompanyMembers(companyId: string): Promise<CompanyMember[]> {
    this.requireAuth();
    return this.users.getAllCompanyMembers(companyId);
  }

  async listManagedUsers(
    companyId: string,
    options?: { limit?: number; offset?: number; search?: string; groupIds?: string[] },
  ): Promise<{ users: ManagedUser[]; total: number }> {
    this.requireAuth();
    return this.users.listManagedUsers(companyId, options);
  }

  async listGroups(companyId: string): Promise<CompanyGroup[]> {
    this.requireAuth();
    return this.users.listGroups(companyId);
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

  async setChannelFavorite(channelId: string, favorite: boolean): Promise<void> {
    this.requireAuth();
    return this.channels.setFavorite(channelId, favorite);
  }

  async enableChannelNotifications(channelId: string): Promise<void> {
    this.requireAuth();
    return this.channels.enableNotifications(channelId);
  }

  async disableChannelNotifications(channelId: string, duration?: number): Promise<void> {
    this.requireAuth();
    return this.channels.disableNotifications(channelId, duration);
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

  async createConversation(memberIds: string[]): Promise<Conversation> {
    this.requireAuth();
    return this.conversations.createConversation(memberIds);
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

  /**
   * Get messages from a channel or conversation.
   * If E2E is unlocked and the chat is encrypted, messages are automatically decrypted.
   * For conversations, the conversation object is fetched (once, then cached) to obtain
   * the AES key. For channels, pass the channel's key via options.channelKey if needed.
   */
  async getMessages(
    id: string,
    chatType: 'channel' | 'conversation',
    options: { limit?: number; offset?: number; after_message_id?: string } = {}
  ): Promise<Message[]> {
    this.requireAuth();

    let aesKey: Buffer | undefined;

    if (this.security.isUnlocked()) {
      if (chatType === 'conversation') {
        const conv = await this.conversations.getConversation(id);
        if (conv.encrypted && conv.key) {
          aesKey = this.security.decryptConversationKey(conv.key, id);
        }
      } else if (chatType === 'channel') {
        const ch = await this.channels.getChannelInfo(id, true);
        if (ch.encrypted && ch.key) {
          // Channel keys are hex-encoded AES-256 keys (64 hex chars = 32 bytes), NOT RSA-encrypted
          // Only decrypt with RSA if the key looks like base64 (longer than 64 chars)
          if (ch.key.length > 64) {
            aesKey = this.security.decryptConversationKey(ch.key, `channel_${id}`);
          } else {
            // Direct AES key — hex-decode
            aesKey = Buffer.from(ch.key, 'hex');
          }
        }
      }
    }

    return this.messages.getMessages(id, chatType, {
      ...options,
      key: aesKey,
    });
  }

  /**
   * Get messages with an explicitly provided AES key (e.g. for channels).
   * Use this when you already have the decrypted AES key from a Channel object.
   */
  async getMessagesWithKey(
    id: string,
    chatType: 'channel' | 'conversation',
    aesKey: Buffer,
    options: { limit?: number; offset?: number; after_message_id?: string } = {}
  ): Promise<Message[]> {
    this.requireAuth();
    return this.messages.getMessages(id, chatType, { ...options, key: aesKey });
  }

  /**
   * Decrypt a conversation's AES key using the unlocked RSA private key.
   * Returns the 32-byte AES key buffer. Result is cached by conversation ID.
   * Throws if E2E is not unlocked or the conversation is not encrypted.
   */
  async getConversationAesKey(conversationId: string): Promise<Buffer> {
    this.requireAuth();
    if (!this.security.isUnlocked()) {
      throw new Error('E2E not unlocked — call unlockE2E() first');
    }
    const conv = await this.conversations.getConversation(conversationId);
    if (!conv.encrypted || !conv.key) {
      throw new Error(`Conversation ${conversationId} is not encrypted or has no key`);
    }
    return this.security.decryptConversationKey(conv.key, conversationId);
  }

  /**
   * Get a channel's AES key.
   * For channel-type channels the key is a hex-encoded AES-256 key (64 hex chars, 32 bytes) — returned directly.
   * For conversation-type channels the key is RSA-OAEP encrypted and must be decrypted with the private RSA key.
   * Result is cached by channel ID.
   * Throws if E2E is not unlocked (for RSA paths) or the channel is not encrypted.
   */
  async getChannelAesKey(channelId: string): Promise<Buffer> {
    this.requireAuth();
    if (!this.security.isUnlocked()) {
      throw new Error('E2E not unlocked — call unlockE2E() first');
    }
    const ch = await this.channels.getChannelInfo(channelId, true);
    if (!ch.encrypted || !ch.key) {
      throw new Error(`Channel ${channelId} is not encrypted or has no key`);
    }
    return ch.key.length > 64
      ? this.security.decryptConversationKey(ch.key, `channel_${channelId}`)
      : Buffer.from(ch.key, 'hex');
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

  async listLikes(messageId: string): Promise<MessageLiker[]> {
    this.requireAuth();
    return this.messages.listLikes(messageId);
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
    return this.messages.downloadFile(file, key);
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

  /** Get storage quota for a channel, conversation, or personal storage */
  async getQuota(type: string, typeId: string): Promise<FileQuota> {
    this.requireAuth();
    return this.files.getQuota(type, typeId);
  }

  async deleteFiles(fileIds: string[]): Promise<void> {
    this.requireAuth();
    return this.files.deleteFiles(fileIds);
  }

  async deleteFolder(folderId: number): Promise<void> {
    this.requireAuth();
    return this.files.deleteFolder(folderId);
  }

  async renameFile(fileId: string, name: string): Promise<void> {
    this.requireAuth();
    return this.files.renameFile(fileId, name);
  }

  async moveFile(fileId: string, parentId: string): Promise<void> {
    this.requireAuth();
    return this.files.moveFile(fileId, parentId);
  }

  async createFolder(name: string, parentId: string, type: string, typeId: string): Promise<FolderEntry> {
    this.requireAuth();
    return this.files.createFolder(name, parentId, type, typeId);
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

  async resetProfileImage(): Promise<void> {
    this.requireAuth();
    return this.account.resetProfileImage();
  }

  async getNotifications(limit?: number, offset?: number): Promise<Notification[]> {
    this.requireAuth();
    return this.account.getNotifications(limit, offset);
  }

  async getNotificationCount(): Promise<number> {
    this.requireAuth();
    return this.account.getNotificationCount();
  }

  async deleteNotification(notificationId: string): Promise<void> {
    this.requireAuth();
    return this.account.deleteNotification(notificationId);
  }

  // ─── Calendar ───────────────────────────────────────────────────────────

  async listEvents(options: ListEventsOptions): Promise<CalendarEvent[]> {
    this.requireAuth();
    return this.calendar.listEvents(options);
  }

  async getEventDetails(eventIds: string[]): Promise<CalendarEvent | null> {
    this.requireAuth();
    return this.calendar.getEventDetails(eventIds);
  }

  async createEvent(options: CreateEventOptions): Promise<string> {
    this.requireAuth();
    return this.calendar.createEvent(options);
  }

  async editEvent(options: EditEventOptions): Promise<string> {
    this.requireAuth();
    return this.calendar.editEvent(options);
  }

  async deleteEvents(eventIds: string[]): Promise<void> {
    this.requireAuth();
    return this.calendar.deleteEvents(eventIds);
  }

  async respondToEvent(eventId: string, userId: string, status: EventInviteStatus): Promise<void> {
    this.requireAuth();
    return this.calendar.respondToEvent(eventId, userId, status);
  }

  async inviteToEvent(eventId: string, userIds: string[]): Promise<void> {
    this.requireAuth();
    return this.calendar.inviteToEvent(eventId, userIds);
  }

  async listAvailableCalendars(): Promise<AvailableCalendar[]> {
    this.requireAuth();
    return this.calendar.listAvailableCalendars();
  }

  async listChannelsHavingEvents(companyId: string): Promise<Channel[]> {
    this.requireAuth();
    return this.calendar.listChannelsHavingEvents(companyId);
  }

  // ─── Broadcast ──────────────────────────────────────────────────────────

  async listBroadcasts(): Promise<Broadcast[]> {
    this.requireAuth();
    return this.broadcast.listBroadcasts();
  }

  async createBroadcast(name: string, memberIds: string[]): Promise<Broadcast> {
    this.requireAuth();
    return this.broadcast.createBroadcast(name, memberIds);
  }

  async deleteBroadcast(listId: string): Promise<void> {
    this.requireAuth();
    return this.broadcast.deleteBroadcast(listId);
  }

  async renameBroadcast(listId: string, name: string): Promise<void> {
    this.requireAuth();
    return this.broadcast.renameBroadcast(listId, name);
  }

  async addBroadcastMembers(listId: string, memberIds: string[]): Promise<void> {
    this.requireAuth();
    return this.broadcast.addMembers(listId, memberIds);
  }

  async removeBroadcastMembers(listId: string, memberIds: string[]): Promise<void> {
    this.requireAuth();
    return this.broadcast.removeMembers(listId, memberIds);
  }

  async listBroadcastMembers(listId: string, sorting?: BroadcastMemberSortField[]): Promise<unknown[]> {
    this.requireAuth();
    return this.broadcast.listMembers(listId, sorting);
  }

  async getBroadcastContent(options: BroadcastContentOptions): Promise<Message[]> {
    this.requireAuth();
    return this.broadcast.getContent(options);
  }

  async sendBroadcastMessage(options: SendBroadcastOptions): Promise<Message> {
    this.requireAuth();
    return this.broadcast.sendMessage(options);
  }

  // ─── Polls (Surveys) ───────────────────────────────────────────────────

  async listPolls(constraint: PollConstraint, companyId?: string): Promise<PollListItem[]> {
    this.requireAuth();
    return this.poll.listPolls(constraint, companyId);
  }

  async getPollDetails(pollId: string, companyId: string): Promise<Poll> {
    this.requireAuth();
    return this.poll.getPollDetails(pollId, companyId);
  }

  async createPoll(options: CreatePollOptions): Promise<Poll> {
    this.requireAuth();
    return this.poll.createPoll(options);
  }

  async editPoll(options: EditPollOptions): Promise<void> {
    this.requireAuth();
    return this.poll.editPoll(options);
  }

  async deletePoll(pollId: string): Promise<boolean> {
    this.requireAuth();
    return this.poll.deletePoll(pollId);
  }

  async publishPoll(pollId: string): Promise<boolean> {
    this.requireAuth();
    return this.poll.publishPoll(pollId);
  }

  async archivePoll(pollId: string, archive: boolean): Promise<boolean> {
    this.requireAuth();
    return this.poll.archivePoll(pollId, archive);
  }

  async watchPoll(pollId: string, watch: boolean): Promise<boolean> {
    this.requireAuth();
    return this.poll.watchPoll(pollId, watch);
  }

  async inviteToPoll(pollId: string, companyId: string, inviteTo: PollInviteTarget, inviteIds: string[]): Promise<void> {
    this.requireAuth();
    return this.poll.inviteToPoll(pollId, companyId, inviteTo, inviteIds);
  }

  async listPollInvitedUsers(pollId: string): Promise<PollUser[]> {
    this.requireAuth();
    return this.poll.listInvitedUsers(pollId);
  }

  async listPollInvites(pollId: string, type?: PollInviteTarget, offset?: number, limit?: number): Promise<unknown[]> {
    this.requireAuth();
    return this.poll.listInvites(pollId, type, offset, limit);
  }

  async listPollParticipants(pollId: string): Promise<PollUser[]> {
    this.requireAuth();
    return this.poll.listParticipants(pollId);
  }

  async exportPoll(pollId: string): Promise<Buffer> {
    this.requireAuth();
    return this.poll.exportPoll(pollId);
  }

  async createPollQuestion(options: CreateQuestionOptions): Promise<PollQuestion> {
    this.requireAuth();
    return this.poll.createQuestion(options);
  }

  async editPollQuestion(options: EditQuestionOptions): Promise<PollQuestion> {
    this.requireAuth();
    return this.poll.editQuestion(options);
  }

  async deletePollQuestion(companyId: string, questionId: string): Promise<boolean> {
    this.requireAuth();
    return this.poll.deleteQuestion(companyId, questionId);
  }

  async listPollAnswers(questionId: string): Promise<PollAnswer[]> {
    this.requireAuth();
    return this.poll.listAnswers(questionId);
  }

  async createPollAnswer(options: CreateAnswerOptions): Promise<PollAnswer> {
    this.requireAuth();
    return this.poll.createAnswer(options);
  }

  async editPollAnswer(options: EditAnswerOptions): Promise<PollAnswer> {
    this.requireAuth();
    return this.poll.editAnswer(options);
  }

  async deletePollAnswer(companyId: string, answerId: string): Promise<boolean> {
    this.requireAuth();
    return this.poll.deleteAnswer(companyId, answerId);
  }

  async storePollUserAnswers(questionId: string, answerIds: string[]): Promise<unknown> {
    this.requireAuth();
    return this.poll.storeUserAnswers(questionId, answerIds);
  }

  // ─── Security ────────────────────────────────────────────────────────────

  async getPrivateKey(): Promise<PrivateKeyResponse> {
    this.requireAuth();
    return this.security.getPrivateKey();
  }

  /**
   * Sign data with the unlocked RSA private key (RSA-SHA256).
   * Requires E2E to be unlocked first.
   */
  signData(data: Buffer): Buffer {
    this.requireAuth();
    return this.security.signData(data);
  }

  /**
   * Encrypt data with a PEM-encoded RSA public key (OAEP+SHA1 padding).
   * Used to encrypt AES keys for another user.
   */
  static encryptWithPublicKey(publicKeyPem: string, data: Buffer): Buffer {
    return SecurityManager.encryptWithPublicKey(publicKeyPem, data);
  }

  // ─── Device-to-Device Key Transfer ───────────────────────────────────────

  /**
   * Login without E2E unlock. The client remains authenticated but E2E is not unlocked.
   * Call `completeKeyTransferWithCode()` or `unlockE2EWithPrivateKey()` afterwards to enable E2E.
   *
   * @param config Login credentials (email, password). securityPassword is NOT required.
   * @returns Auth state
   */
  async loginWithoutE2E(config: { email: string; password: string; appName?: string }): Promise<AuthState> {
    const authConfig: AuthConfig = {
      email: config.email,
      password: config.password,
      appName: config.appName,
      // securityPassword is intentionally omitted - no auto-unlock
    };
    return this.auth.login(authConfig);
  }

  /**
   * Initiate a key transfer to another device.
   * This triggers the server to generate a 6-digit code and show it on the target device.
   *
   * Note: The actual transfer happens via Socket.io or server-side logic.
   * This method prepares the transfer on the target device side.
   *
   * @param targetDeviceId The device ID of the target device that will show the code
   */
  async initiateKeyTransferToDevice(targetDeviceId: string): Promise<void> {
    this.requireAuth();
    // Currently this is a placeholder - the actual implementation would trigger
    // the target device via Socket.io or a dedicated endpoint
    // The target device needs to call an endpoint to prepare the encrypted KEK
    throw new Error('initiateKeyTransferToDevice: Not yet fully implemented. Requires Socket.io integration for triggering the target device.');
  }

  /**
   * Complete the key transfer by entering the 6-digit code from the target device.
   *
   * Process:
   * 1. Get signing key from server (already encrypted with code-derived KEK)
   * 2. Derive KEK from the 6-digit code
   * 3. Decrypt the encryptedKEK
   * 4. Use decrypted KEK to decrypt the private key ciphertext
   * 5. Store the private key in E2E state
   *
   * @param code The 6-digit code displayed on the target device
   * @returns The decrypted private key as JWK (for storage)
   */
  async completeKeyTransferWithCode(code: string): Promise<RsaPrivateKeyJwk> {
    this.requireAuth();

    // Step 1: Get the signing key data (encrypted by target device with code-derived KEK)
    const signingKeyData = await this.security.getSigningKeyForTransfer();

    // Step 2: Decrypt the signing key with the code
    const privateKeyJwk = await this.security.decryptSigningKeyWithCode(signingKeyData, code);

    return privateKeyJwk;
  }

  /**
   * Unlock E2E with a pre-decrypted private key (JWK format).
   * Use this for server-side session restoration without repeating the code flow.
   *
   * @param jwk The RSA private key in JWK format (from exportPrivateKey() or decryptSigningKeyWithCode())
   */
  unlockE2EWithPrivateKey(jwk: RsaPrivateKeyJwk): void {
    this.requireAuth();
    this.security.setPrivateKeyFromJWK(jwk);
  }

  /**
   * Export the current decrypted private key as JWK.
   * Useful for persisting the key in an encrypted session token.
   *
   * @returns The private key as JWK, or undefined if E2E is not unlocked
   */
  exportPrivateKey(): RsaPrivateKeyJwk | undefined {
    this.requireAuth();
    return this.security.exportPrivateKeyAsJWK();
  }

  /**
   * Check if a device supports key transfer.
   * @param device The device to check
   * @returns true if the device supports key transfer
   */
  deviceSupportsKeyTransfer(device: ActiveDevice): boolean {
    return device.key_transfer_support === true;
  }

  /**
   * Get devices that support key transfer from the list of active devices.
   * @returns Filtered list of devices that can be used for key transfer
   */
  async getDevicesWithKeyTransferSupport(): Promise<ActiveDevice[]> {
    this.requireAuth();
    const devices = await this.account.listActiveDevices();
    return devices.filter(d => d.key_transfer_support);
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
