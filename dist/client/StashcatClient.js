"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StashcatClient = void 0;
const request_1 = require("../api/request");
const login_1 = require("../auth/login");
const channels_1 = require("../chats/channels");
const conversations_1 = require("../chats/conversations");
const messages_1 = require("../chats/messages");
const users_1 = require("../users/users");
const account_1 = require("../account/account");
const files_1 = require("../files/files");
const security_1 = require("../security/security");
const realtime_1 = require("../realtime/realtime");
const calendar_1 = require("../calendar/calendar");
const broadcast_1 = require("../broadcast/broadcast");
const poll_1 = require("../poll/poll");
class StashcatClient {
    constructor(config = {}) {
        this.api = new request_1.StashcatAPI(config);
        this.auth = new login_1.AuthManager(this.api, config.deviceId);
        this.channels = new channels_1.ChannelManager(this.api);
        this.conversations = new conversations_1.ConversationManager(this.api);
        this.messages = new messages_1.MessageManager(this.api);
        this.users = new users_1.UserManager(this.api);
        this.account = new account_1.AccountManager(this.api);
        this.files = new files_1.FileManager(this.api);
        this.security = new security_1.SecurityManager(this.api);
        this.calendar = new calendar_1.CalendarManager(this.api);
        this.broadcast = new broadcast_1.BroadcastManager(this.api);
        this.poll = new poll_1.PollManager(this.api);
    }
    // ─── Auth ────────────────────────────────────────────────────────────────
    async login(config) {
        await this.auth.login(config);
        // Auto-unlock E2E if security password provided
        if (config.securityPassword) {
            await this.security.unlockPrivateKey(config.securityPassword);
        }
    }
    logout() {
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
    async unlockE2E(securityPassword) {
        this.requireAuth();
        await this.security.unlockPrivateKey(securityPassword);
    }
    /** Returns true if E2E decryption is unlocked. */
    isE2EUnlocked() {
        return this.security.isUnlocked();
    }
    /**
     * Serialize the current session to a plain object that can be stored
     * (e.g. in a Nextcloud database) and restored later without re-login.
     * Note: E2E unlock state is NOT serialized for security — call unlockE2E() again after restore.
     */
    serialize() {
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
    static fromSession(session, config = {}) {
        const client = new StashcatClient({
            ...config,
            baseUrl: session.baseUrl || config.baseUrl,
            deviceId: session.deviceId,
        });
        client.auth.restoreSession(session.clientKey);
        return client;
    }
    isAuthenticated() {
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
    async getMe() {
        this.requireAuth();
        return this.users.getMe();
    }
    async getUserInfo(userId, withKey = true) {
        this.requireAuth();
        return this.users.getUserInfo(userId, withKey);
    }
    async getCompanies() {
        this.requireAuth();
        return this.users.getCompanies();
    }
    async getCompanyDetails(companyId) {
        this.requireAuth();
        return this.users.getCompanyDetails(companyId);
    }
    async getCompanyMembers(companyId, options) {
        this.requireAuth();
        return this.users.getCompanyMembers(companyId, options);
    }
    async getAllCompanyMembers(companyId) {
        this.requireAuth();
        return this.users.getAllCompanyMembers(companyId);
    }
    async listManagedUsers(companyId, options) {
        this.requireAuth();
        return this.users.listManagedUsers(companyId, options);
    }
    async listGroups(companyId) {
        this.requireAuth();
        return this.users.listGroups(companyId);
    }
    // ─── Channels ────────────────────────────────────────────────────────────
    async getChannels(companyId) {
        this.requireAuth();
        return this.channels.getChannels(companyId);
    }
    async getVisibleChannels(companyId, options = {}) {
        this.requireAuth();
        return this.channels.getVisibleChannels(companyId, options);
    }
    async getChannelInfo(channelId, withoutMembers = false) {
        this.requireAuth();
        return this.channels.getChannelInfo(channelId, withoutMembers);
    }
    async createChannel(options) {
        this.requireAuth();
        return this.channels.createChannel(options);
    }
    async editChannel(options) {
        this.requireAuth();
        return this.channels.editChannel(options);
    }
    async deleteChannel(channelId) {
        this.requireAuth();
        return this.channels.deleteChannel(channelId);
    }
    async joinChannel(channelId, password) {
        this.requireAuth();
        return this.channels.joinChannel(channelId, password);
    }
    async quitChannel(channelId) {
        this.requireAuth();
        return this.channels.quitChannel(channelId);
    }
    async inviteUsersToChannel(channelId, userIds, text) {
        this.requireAuth();
        return this.channels.inviteUsers(channelId, userIds, text);
    }
    async getChannelMembers(channelId, options = {}) {
        this.requireAuth();
        return this.channels.getChannelMembers(channelId, options);
    }
    async removeUserFromChannel(channelId, userId) {
        this.requireAuth();
        return this.channels.removeUser(channelId, userId);
    }
    async addChannelModerator(channelId, userId) {
        this.requireAuth();
        return this.channels.addModeratorStatus(channelId, userId);
    }
    async removeChannelModerator(channelId, userId) {
        this.requireAuth();
        return this.channels.removeModeratorStatus(channelId, userId);
    }
    async acceptChannelInvite(inviteId) {
        this.requireAuth();
        return this.channels.acceptInvite(inviteId);
    }
    async declineChannelInvite(inviteId) {
        this.requireAuth();
        return this.channels.declineInvite(inviteId);
    }
    async setChannelFavorite(channelId, favorite) {
        this.requireAuth();
        return this.channels.setFavorite(channelId, favorite);
    }
    async enableChannelNotifications(channelId) {
        this.requireAuth();
        return this.channels.enableNotifications(channelId);
    }
    async disableChannelNotifications(channelId, duration) {
        this.requireAuth();
        return this.channels.disableNotifications(channelId, duration);
    }
    // ─── Conversations ───────────────────────────────────────────────────────
    async getConversations(options = {}) {
        this.requireAuth();
        return this.conversations.getConversations(options);
    }
    async getConversation(conversationId) {
        this.requireAuth();
        return this.conversations.getConversation(conversationId);
    }
    async createConversation(memberIds) {
        this.requireAuth();
        return this.conversations.createConversation(memberIds);
    }
    async createEncryptedConversation(memberIds, uniqueIdentifier) {
        this.requireAuth();
        return this.conversations.createEncryptedConversation(memberIds, uniqueIdentifier);
    }
    async archiveConversation(conversationId) {
        this.requireAuth();
        return this.conversations.archiveConversation(conversationId);
    }
    async setConversationFavorite(conversationId, favorite) {
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
    async getMessages(id, chatType, options = {}) {
        this.requireAuth();
        let aesKey;
        if (this.security.isUnlocked()) {
            if (chatType === 'conversation') {
                const conv = await this.conversations.getConversation(id);
                if (conv.encrypted && conv.key) {
                    aesKey = this.security.decryptConversationKey(conv.key, id);
                }
            }
            else if (chatType === 'channel') {
                const ch = await this.channels.getChannelInfo(id, true);
                if (ch.encrypted && ch.key) {
                    aesKey = this.security.decryptConversationKey(ch.key, `channel_${id}`);
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
    async getMessagesWithKey(id, chatType, aesKey, options = {}) {
        this.requireAuth();
        return this.messages.getMessages(id, chatType, { ...options, key: aesKey });
    }
    /**
     * Decrypt a conversation's AES key using the unlocked RSA private key.
     * Returns the 32-byte AES key buffer. Result is cached by conversation ID.
     * Throws if E2E is not unlocked or the conversation is not encrypted.
     */
    async getConversationAesKey(conversationId) {
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
     * Decrypt a channel's AES key using the unlocked RSA private key.
     * Returns the 32-byte AES key buffer. Result is cached by channel ID.
     * Throws if E2E is not unlocked or the channel is not encrypted.
     */
    async getChannelAesKey(channelId) {
        this.requireAuth();
        if (!this.security.isUnlocked()) {
            throw new Error('E2E not unlocked — call unlockE2E() first');
        }
        const ch = await this.channels.getChannelInfo(channelId, true);
        if (!ch.encrypted || !ch.key) {
            throw new Error(`Channel ${channelId} is not encrypted or has no key`);
        }
        return this.security.decryptConversationKey(ch.key, `channel_${channelId}`);
    }
    async sendMessage(options) {
        this.requireAuth();
        return this.messages.sendMessage(options);
    }
    async deleteMessage(messageId) {
        this.requireAuth();
        return this.messages.deleteMessage(messageId);
    }
    async markAsRead(id, chatType, messageId) {
        this.requireAuth();
        return this.messages.markAsRead(id, chatType, messageId);
    }
    async likeMessage(messageId) {
        this.requireAuth();
        return this.messages.likeMessage(messageId);
    }
    async listLikes(messageId) {
        this.requireAuth();
        return this.messages.listLikes(messageId);
    }
    async unlikeMessage(messageId) {
        this.requireAuth();
        return this.messages.unlikeMessage(messageId);
    }
    async flagMessage(messageId) {
        this.requireAuth();
        return this.messages.flagMessage(messageId);
    }
    async unflagMessage(messageId) {
        this.requireAuth();
        return this.messages.unflagMessage(messageId);
    }
    async getFlaggedMessages(type, typeId, options = {}) {
        this.requireAuth();
        return this.messages.getFlaggedMessages(type, typeId, options);
    }
    // ─── Files ───────────────────────────────────────────────────────────────
    async downloadFile(file, key) {
        this.requireAuth();
        return this.messages.downloadFile(file, key);
    }
    async uploadFile(filePath, uploadOptions, chunkSize) {
        this.requireAuth();
        return this.files.uploadFile(filePath, uploadOptions, chunkSize);
    }
    async getFileInfo(fileId) {
        this.requireAuth();
        return this.files.getFileInfo(fileId);
    }
    async listFolder(options = {}) {
        this.requireAuth();
        return this.files.listFolder(options);
    }
    /** Listet die persönliche Ablage des eingeloggten Nutzers ("Meine Dateien") */
    async listPersonalFiles(options = {}) {
        this.requireAuth();
        const me = await this.users.getMe();
        return this.files.listPersonalFiles(me.id, options);
    }
    async deleteFiles(fileIds) {
        this.requireAuth();
        return this.files.deleteFiles(fileIds);
    }
    async renameFile(fileId, name) {
        this.requireAuth();
        return this.files.renameFile(fileId, name);
    }
    async moveFile(fileId, parentId) {
        this.requireAuth();
        return this.files.moveFile(fileId, parentId);
    }
    async getStorageQuota(type, typeId) {
        this.requireAuth();
        return this.files.getQuota(type, typeId);
    }
    // ─── Account ─────────────────────────────────────────────────────────────
    async changeStatus(status) {
        this.requireAuth();
        return this.account.changeStatus(status);
    }
    async changePassword(oldPassword, newPassword) {
        this.requireAuth();
        return this.account.changePassword(oldPassword, newPassword);
    }
    async getAccountSettings() {
        this.requireAuth();
        return this.account.getSettings();
    }
    async listActiveDevices() {
        this.requireAuth();
        return this.account.listActiveDevices();
    }
    async deactivateDevice(deviceId) {
        this.requireAuth();
        return this.account.deactivateDevice(deviceId);
    }
    async storeProfileImage(imgBase64) {
        this.requireAuth();
        return this.account.storeProfileImage(imgBase64);
    }
    async resetProfileImage() {
        this.requireAuth();
        return this.account.resetProfileImage();
    }
    async getNotifications(limit, offset) {
        this.requireAuth();
        return this.account.getNotifications(limit, offset);
    }
    async getNotificationCount() {
        this.requireAuth();
        return this.account.getNotificationCount();
    }
    async deleteNotification(notificationId) {
        this.requireAuth();
        return this.account.deleteNotification(notificationId);
    }
    // ─── Calendar ───────────────────────────────────────────────────────────
    async listEvents(options) {
        this.requireAuth();
        return this.calendar.listEvents(options);
    }
    async getEventDetails(eventIds) {
        this.requireAuth();
        return this.calendar.getEventDetails(eventIds);
    }
    async createEvent(options) {
        this.requireAuth();
        return this.calendar.createEvent(options);
    }
    async editEvent(options) {
        this.requireAuth();
        return this.calendar.editEvent(options);
    }
    async deleteEvents(eventIds) {
        this.requireAuth();
        return this.calendar.deleteEvents(eventIds);
    }
    async respondToEvent(eventId, userId, status) {
        this.requireAuth();
        return this.calendar.respondToEvent(eventId, userId, status);
    }
    async inviteToEvent(eventId, userIds) {
        this.requireAuth();
        return this.calendar.inviteToEvent(eventId, userIds);
    }
    async listAvailableCalendars() {
        this.requireAuth();
        return this.calendar.listAvailableCalendars();
    }
    async listChannelsHavingEvents(companyId) {
        this.requireAuth();
        return this.calendar.listChannelsHavingEvents(companyId);
    }
    // ─── Broadcast ──────────────────────────────────────────────────────────
    async listBroadcasts() {
        this.requireAuth();
        return this.broadcast.listBroadcasts();
    }
    async createBroadcast(name, memberIds) {
        this.requireAuth();
        return this.broadcast.createBroadcast(name, memberIds);
    }
    async deleteBroadcast(listId) {
        this.requireAuth();
        return this.broadcast.deleteBroadcast(listId);
    }
    async renameBroadcast(listId, name) {
        this.requireAuth();
        return this.broadcast.renameBroadcast(listId, name);
    }
    async addBroadcastMembers(listId, memberIds) {
        this.requireAuth();
        return this.broadcast.addMembers(listId, memberIds);
    }
    async removeBroadcastMembers(listId, memberIds) {
        this.requireAuth();
        return this.broadcast.removeMembers(listId, memberIds);
    }
    async listBroadcastMembers(listId, sorting) {
        this.requireAuth();
        return this.broadcast.listMembers(listId, sorting);
    }
    async getBroadcastContent(options) {
        this.requireAuth();
        return this.broadcast.getContent(options);
    }
    async sendBroadcastMessage(options) {
        this.requireAuth();
        return this.broadcast.sendMessage(options);
    }
    // ─── Polls (Surveys) ───────────────────────────────────────────────────
    async listPolls(constraint, companyId) {
        this.requireAuth();
        return this.poll.listPolls(constraint, companyId);
    }
    async getPollDetails(pollId, companyId) {
        this.requireAuth();
        return this.poll.getPollDetails(pollId, companyId);
    }
    async createPoll(options) {
        this.requireAuth();
        return this.poll.createPoll(options);
    }
    async editPoll(options) {
        this.requireAuth();
        return this.poll.editPoll(options);
    }
    async deletePoll(pollId) {
        this.requireAuth();
        return this.poll.deletePoll(pollId);
    }
    async publishPoll(pollId) {
        this.requireAuth();
        return this.poll.publishPoll(pollId);
    }
    async archivePoll(pollId, archive) {
        this.requireAuth();
        return this.poll.archivePoll(pollId, archive);
    }
    async watchPoll(pollId, watch) {
        this.requireAuth();
        return this.poll.watchPoll(pollId, watch);
    }
    async inviteToPoll(pollId, companyId, inviteTo, inviteIds) {
        this.requireAuth();
        return this.poll.inviteToPoll(pollId, companyId, inviteTo, inviteIds);
    }
    async listPollInvitedUsers(pollId) {
        this.requireAuth();
        return this.poll.listInvitedUsers(pollId);
    }
    async listPollInvites(pollId, type, offset, limit) {
        this.requireAuth();
        return this.poll.listInvites(pollId, type, offset, limit);
    }
    async listPollParticipants(pollId) {
        this.requireAuth();
        return this.poll.listParticipants(pollId);
    }
    async exportPoll(pollId) {
        this.requireAuth();
        return this.poll.exportPoll(pollId);
    }
    async createPollQuestion(options) {
        this.requireAuth();
        return this.poll.createQuestion(options);
    }
    async editPollQuestion(options) {
        this.requireAuth();
        return this.poll.editQuestion(options);
    }
    async deletePollQuestion(companyId, questionId) {
        this.requireAuth();
        return this.poll.deleteQuestion(companyId, questionId);
    }
    async listPollAnswers(questionId) {
        this.requireAuth();
        return this.poll.listAnswers(questionId);
    }
    async createPollAnswer(options) {
        this.requireAuth();
        return this.poll.createAnswer(options);
    }
    async editPollAnswer(options) {
        this.requireAuth();
        return this.poll.editAnswer(options);
    }
    async deletePollAnswer(companyId, answerId) {
        this.requireAuth();
        return this.poll.deleteAnswer(companyId, answerId);
    }
    async storePollUserAnswers(questionId, answerIds) {
        this.requireAuth();
        return this.poll.storeUserAnswers(questionId, answerIds);
    }
    // ─── Security ────────────────────────────────────────────────────────────
    async getPrivateKey() {
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
    async createRealtimeManager(options = {}) {
        this.requireAuth();
        const clientKey = this.auth.getClientKey();
        const deviceId = this.api.getDeviceId();
        if (!clientKey)
            throw new Error('Kein client_key — bitte erst einloggen.');
        // socket_id (= hidden_id für Auth-Emit) aus /users/me laden
        const me = await this.users.getMe();
        const hiddenId = me.socket_id ?? '';
        return new realtime_1.RealtimeManager(clientKey, deviceId, hiddenId, options);
    }
    // ─── Internal ────────────────────────────────────────────────────────────
    requireAuth() {
        if (!this.isAuthenticated()) {
            throw new Error('Not authenticated. Please login first.');
        }
    }
}
exports.StashcatClient = StashcatClient;
//# sourceMappingURL=StashcatClient.js.map