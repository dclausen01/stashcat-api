import { StashcatAPI, StashcatConfig } from '../api/request';
import { AuthConfig } from '../auth/types';
import { CreateChannelOptions, EditChannelOptions, ChannelMembersOptions } from '../chats/channels';
import { SendMessageOptions } from '../chats/messages';
import { Channel, ChannelMember, Conversation, Message, MessageLiker, PaginationOptions } from '../chats/types';
import { User, CompanyMember, ManagedUser, CompanyGroup } from '../users/types';
import { AccountSettings, ActiveDevice, Notification } from '../account/types';
import { FileInfo, FolderContent, FolderListOptions, FileUploadOptions, FileQuota, FolderEntry } from '../files/types';
import { PrivateKeyResponse } from '../security/security';
import { RealtimeManager } from '../realtime/realtime';
import { RealtimeManagerOptions } from '../realtime/types';
import { CalendarEvent, CreateEventOptions, EditEventOptions, ListEventsOptions, EventInviteStatus, AvailableCalendar } from '../calendar/types';
import { Broadcast, BroadcastContentOptions, SendBroadcastOptions, BroadcastMemberSortField } from '../broadcast/types';
import { Poll, PollListItem, PollQuestion, PollAnswer, PollUser, PollConstraint, PollInviteTarget, CreatePollOptions, EditPollOptions, CreateQuestionOptions, EditQuestionOptions, CreateAnswerOptions, EditAnswerOptions } from '../poll/types';
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
export declare class StashcatClient {
    api: StashcatAPI;
    private auth;
    private channels;
    private conversations;
    private messages;
    private users;
    private account;
    private files;
    private security;
    private calendar;
    private broadcast;
    private poll;
    constructor(config?: StashcatClientConfig);
    login(config: AuthConfig): Promise<void>;
    logout(): void;
    /**
     * Unlock E2E decryption explicitly.
     * Fetches the RSA private key from the server and decrypts it with the given password.
     * After this call, getMessages() for encrypted conversations returns plaintext.
     *
     * The security password may be identical to the login password (Stashcat default).
     */
    unlockE2E(securityPassword: string): Promise<void>;
    /** Returns true if E2E decryption is unlocked. */
    isE2EUnlocked(): boolean;
    /**
     * Serialize the current session to a plain object that can be stored
     * (e.g. in a Nextcloud database) and restored later without re-login.
     * Note: E2E unlock state is NOT serialized for security — call unlockE2E() again after restore.
     */
    serialize(): SerializedSession;
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
    static fromSession(session: SerializedSession, config?: StashcatClientConfig): StashcatClient;
    isAuthenticated(): boolean;
    getClientInfo(): {
        deviceId: string;
        isAuthenticated: boolean;
        isE2EUnlocked: boolean;
    };
    getMe(): Promise<User>;
    getUserInfo(userId: string, withKey?: boolean): Promise<User>;
    getCompanies(): Promise<import('../users/types').Company[]>;
    getCompanyDetails(companyId: string): Promise<import('../users/types').Company>;
    getCompanyMembers(companyId: string, options?: {
        limit?: number;
        offset?: number;
        search?: string;
        noCache?: boolean;
    } | boolean): Promise<CompanyMember[]>;
    getAllCompanyMembers(companyId: string): Promise<CompanyMember[]>;
    listManagedUsers(companyId: string, options?: {
        limit?: number;
        offset?: number;
        search?: string;
        groupIds?: string[];
    }): Promise<{
        users: ManagedUser[];
        total: number;
    }>;
    listGroups(companyId: string): Promise<CompanyGroup[]>;
    getChannels(companyId: string): Promise<Channel[]>;
    getVisibleChannels(companyId: string, options?: {
        limit?: number;
        offset?: number;
        search?: string;
    }): Promise<Channel[]>;
    getChannelInfo(channelId: string, withoutMembers?: boolean): Promise<Channel>;
    createChannel(options: CreateChannelOptions): Promise<Channel>;
    editChannel(options: EditChannelOptions): Promise<Channel>;
    deleteChannel(channelId: string): Promise<void>;
    joinChannel(channelId: string, password?: string): Promise<void>;
    quitChannel(channelId: string): Promise<void>;
    inviteUsersToChannel(channelId: string, userIds: string[], text?: string): Promise<void>;
    getChannelMembers(channelId: string, options?: ChannelMembersOptions): Promise<ChannelMember[]>;
    removeUserFromChannel(channelId: string, userId: string): Promise<void>;
    addChannelModerator(channelId: string, userId: string): Promise<void>;
    removeChannelModerator(channelId: string, userId: string): Promise<void>;
    acceptChannelInvite(inviteId: string): Promise<void>;
    declineChannelInvite(inviteId: string): Promise<void>;
    setChannelFavorite(channelId: string, favorite: boolean): Promise<void>;
    enableChannelNotifications(channelId: string): Promise<void>;
    disableChannelNotifications(channelId: string, duration?: number): Promise<void>;
    getConversations(options?: PaginationOptions): Promise<Conversation[]>;
    getConversation(conversationId: string): Promise<Conversation>;
    createConversation(memberIds: string[]): Promise<Conversation>;
    createEncryptedConversation(memberIds: string[], uniqueIdentifier: string): Promise<Conversation>;
    archiveConversation(conversationId: string): Promise<void>;
    setConversationFavorite(conversationId: string, favorite: boolean): Promise<void>;
    /**
     * Get messages from a channel or conversation.
     * If E2E is unlocked and the chat is encrypted, messages are automatically decrypted.
     * For conversations, the conversation object is fetched (once, then cached) to obtain
     * the AES key. For channels, pass the channel's key via options.channelKey if needed.
     */
    getMessages(id: string, chatType: 'channel' | 'conversation', options?: {
        limit?: number;
        offset?: number;
        after_message_id?: string;
    }): Promise<Message[]>;
    /**
     * Get messages with an explicitly provided AES key (e.g. for channels).
     * Use this when you already have the decrypted AES key from a Channel object.
     */
    getMessagesWithKey(id: string, chatType: 'channel' | 'conversation', aesKey: Buffer, options?: {
        limit?: number;
        offset?: number;
        after_message_id?: string;
    }): Promise<Message[]>;
    /**
     * Decrypt a conversation's AES key using the unlocked RSA private key.
     * Returns the 32-byte AES key buffer. Result is cached by conversation ID.
     * Throws if E2E is not unlocked or the conversation is not encrypted.
     */
    getConversationAesKey(conversationId: string): Promise<Buffer>;
    /**
     * Get a channel's AES key.
     * For channel-type channels the key is a hex-encoded AES-256 key (64 hex chars, 32 bytes) — returned directly.
     * For conversation-type channels the key is RSA-OAEP encrypted and must be decrypted with the private RSA key.
     * Result is cached by channel ID.
     * Throws if E2E is not unlocked (for RSA paths) or the channel is not encrypted.
     */
    getChannelAesKey(channelId: string): Promise<Buffer>;
    sendMessage(options: SendMessageOptions): Promise<Message>;
    deleteMessage(messageId: string): Promise<void>;
    markAsRead(id: string, chatType: 'channel' | 'conversation', messageId: string): Promise<void>;
    likeMessage(messageId: string): Promise<void>;
    listLikes(messageId: string): Promise<MessageLiker[]>;
    unlikeMessage(messageId: string): Promise<void>;
    flagMessage(messageId: string): Promise<void>;
    unflagMessage(messageId: string): Promise<void>;
    getFlaggedMessages(type: 'channel' | 'conversation', typeId: string, options?: {
        limit?: number;
        offset?: number;
    }): Promise<Message[]>;
    downloadFile(file: {
        id: string;
        encrypted?: boolean;
        e2e_iv?: string | null;
    }, key?: Buffer): Promise<Buffer>;
    uploadFile(filePath: string, uploadOptions: FileUploadOptions, chunkSize?: number): Promise<FileInfo>;
    getFileInfo(fileId: string): Promise<FileInfo>;
    listFolder(options?: FolderListOptions): Promise<FolderContent>;
    /** Listet die persönliche Ablage des eingeloggten Nutzers ("Meine Dateien") */
    listPersonalFiles(options?: Omit<FolderListOptions, 'type' | 'type_id'>): Promise<FolderContent>;
    deleteFiles(fileIds: string[]): Promise<void>;
    renameFile(fileId: string, name: string): Promise<void>;
    moveFile(fileId: string, parentId: string): Promise<void>;
    createFolder(name: string, parentId: string, type: string, typeId: string): Promise<FolderEntry>;
    getStorageQuota(type: string, typeId: string): Promise<FileQuota>;
    changeStatus(status: string): Promise<void>;
    changePassword(oldPassword: string, newPassword: string): Promise<void>;
    getAccountSettings(): Promise<AccountSettings>;
    listActiveDevices(): Promise<ActiveDevice[]>;
    deactivateDevice(deviceId: string): Promise<void>;
    storeProfileImage(imgBase64: string): Promise<void>;
    resetProfileImage(): Promise<void>;
    getNotifications(limit?: number, offset?: number): Promise<Notification[]>;
    getNotificationCount(): Promise<number>;
    deleteNotification(notificationId: string): Promise<void>;
    listEvents(options: ListEventsOptions): Promise<CalendarEvent[]>;
    getEventDetails(eventIds: string[]): Promise<CalendarEvent | null>;
    createEvent(options: CreateEventOptions): Promise<string>;
    editEvent(options: EditEventOptions): Promise<string>;
    deleteEvents(eventIds: string[]): Promise<void>;
    respondToEvent(eventId: string, userId: string, status: EventInviteStatus): Promise<void>;
    inviteToEvent(eventId: string, userIds: string[]): Promise<void>;
    listAvailableCalendars(): Promise<AvailableCalendar[]>;
    listChannelsHavingEvents(companyId: string): Promise<Channel[]>;
    listBroadcasts(): Promise<Broadcast[]>;
    createBroadcast(name: string, memberIds: string[]): Promise<Broadcast>;
    deleteBroadcast(listId: string): Promise<void>;
    renameBroadcast(listId: string, name: string): Promise<void>;
    addBroadcastMembers(listId: string, memberIds: string[]): Promise<void>;
    removeBroadcastMembers(listId: string, memberIds: string[]): Promise<void>;
    listBroadcastMembers(listId: string, sorting?: BroadcastMemberSortField[]): Promise<unknown[]>;
    getBroadcastContent(options: BroadcastContentOptions): Promise<Message[]>;
    sendBroadcastMessage(options: SendBroadcastOptions): Promise<Message>;
    listPolls(constraint: PollConstraint, companyId?: string): Promise<PollListItem[]>;
    getPollDetails(pollId: string, companyId: string): Promise<Poll>;
    createPoll(options: CreatePollOptions): Promise<Poll>;
    editPoll(options: EditPollOptions): Promise<void>;
    deletePoll(pollId: string): Promise<boolean>;
    publishPoll(pollId: string): Promise<boolean>;
    archivePoll(pollId: string, archive: boolean): Promise<boolean>;
    watchPoll(pollId: string, watch: boolean): Promise<boolean>;
    inviteToPoll(pollId: string, companyId: string, inviteTo: PollInviteTarget, inviteIds: string[]): Promise<void>;
    listPollInvitedUsers(pollId: string): Promise<PollUser[]>;
    listPollInvites(pollId: string, type?: PollInviteTarget, offset?: number, limit?: number): Promise<unknown[]>;
    listPollParticipants(pollId: string): Promise<PollUser[]>;
    exportPoll(pollId: string): Promise<Buffer>;
    createPollQuestion(options: CreateQuestionOptions): Promise<PollQuestion>;
    editPollQuestion(options: EditQuestionOptions): Promise<PollQuestion>;
    deletePollQuestion(companyId: string, questionId: string): Promise<boolean>;
    listPollAnswers(questionId: string): Promise<PollAnswer[]>;
    createPollAnswer(options: CreateAnswerOptions): Promise<PollAnswer>;
    editPollAnswer(options: EditAnswerOptions): Promise<PollAnswer>;
    deletePollAnswer(companyId: string, answerId: string): Promise<boolean>;
    storePollUserAnswers(questionId: string, answerIds: string[]): Promise<unknown>;
    getPrivateKey(): Promise<PrivateKeyResponse>;
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
    createRealtimeManager(options?: RealtimeManagerOptions): Promise<RealtimeManager>;
    private requireAuth;
}
//# sourceMappingURL=StashcatClient.d.ts.map