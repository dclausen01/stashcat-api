"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChannelManager = void 0;
class ChannelManager {
    constructor(api) {
        this.api = api;
    }
    /** Get all subscribed channels for a company */
    async getChannels(companyId) {
        const request = this.api.createAuthenticatedRequestData({ company: companyId });
        try {
            const response = await this.api.post('/channels/subscripted', request);
            return response.channels || [];
        }
        catch (error) {
            throw new Error(`Failed to get channels: ${error instanceof Error ? error.message : error}`);
        }
    }
    /** Get public/visible channels for a company (discovery) */
    async getVisibleChannels(companyId, options = {}) {
        const request = this.api.createAuthenticatedRequestData({
            company: companyId,
            limit: options.limit || 50,
            offset: options.offset || 0,
            search: options.search,
        });
        try {
            const response = await this.api.post('/channels/visible', request);
            return response.channels || [];
        }
        catch (error) {
            throw new Error(`Failed to get visible channels: ${error instanceof Error ? error.message : error}`);
        }
    }
    /** Get detailed channel info including members */
    async getChannelInfo(channelId, withoutMembers = false) {
        const request = this.api.createAuthenticatedRequestData({
            channel_id: channelId,
            without_members: withoutMembers,
        });
        try {
            const response = await this.api.post('/channels/info', request);
            return response.channels ?? response.channel;
        }
        catch (error) {
            throw new Error(`Failed to get channel info: ${error instanceof Error ? error.message : error}`);
        }
    }
    /** Create a new channel */
    async createChannel(options) {
        const request = this.api.createAuthenticatedRequestData(options);
        try {
            const response = await this.api.post('/channels/create', request);
            const ch = response.channels ?? response.channel;
            if (!ch)
                throw new Error('No channel in response');
            return ch;
        }
        catch (error) {
            throw new Error(`Failed to create channel: ${error instanceof Error ? error.message : error}`);
        }
    }
    /** Edit an existing channel */
    async editChannel(options) {
        const request = this.api.createAuthenticatedRequestData(options);
        try {
            const response = await this.api.post('/channels/edit', request);
            const ch = response.channels ?? response.channel;
            if (!ch)
                throw new Error('No channel in response');
            return ch;
        }
        catch (error) {
            throw new Error(`Failed to edit channel: ${error instanceof Error ? error.message : error}`);
        }
    }
    /** Delete a channel */
    async deleteChannel(channelId) {
        const request = this.api.createAuthenticatedRequestData({ channel_id: channelId });
        try {
            await this.api.post('/channels/delete', request);
        }
        catch (error) {
            throw new Error(`Failed to delete channel: ${error instanceof Error ? error.message : error}`);
        }
    }
    /** Join a channel (optionally with password) */
    async joinChannel(channelId, password) {
        const request = this.api.createAuthenticatedRequestData({ channel_id: channelId, password });
        try {
            await this.api.post('/channels/join', request);
        }
        catch (error) {
            throw new Error(`Failed to join channel: ${error instanceof Error ? error.message : error}`);
        }
    }
    /** Leave a channel */
    async quitChannel(channelId) {
        const request = this.api.createAuthenticatedRequestData({ channel_id: channelId });
        try {
            await this.api.post('/channels/quit', request);
        }
        catch (error) {
            throw new Error(`Failed to quit channel: ${error instanceof Error ? error.message : error}`);
        }
    }
    /** Invite users to a channel */
    async inviteUsers(channelId, userIds, text) {
        const request = this.api.createAuthenticatedRequestData({
            channel_id: channelId,
            users: userIds,
            text,
        });
        try {
            await this.api.post('/channels/createInvite', request);
        }
        catch (error) {
            throw new Error(`Failed to invite users: ${error instanceof Error ? error.message : error}`);
        }
    }
    /** Accept a channel invitation */
    async acceptInvite(inviteId) {
        const request = this.api.createAuthenticatedRequestData({ invite_id: inviteId });
        try {
            await this.api.post('/channels/acceptInvite', request);
        }
        catch (error) {
            throw new Error(`Failed to accept invite: ${error instanceof Error ? error.message : error}`);
        }
    }
    /** Decline a channel invitation */
    async declineInvite(inviteId) {
        const request = this.api.createAuthenticatedRequestData({ invite_id: inviteId });
        try {
            await this.api.post('/channels/declineInvite', request);
        }
        catch (error) {
            throw new Error(`Failed to decline invite: ${error instanceof Error ? error.message : error}`);
        }
    }
    /** Get channel members with pagination and filtering */
    async getChannelMembers(channelId, options = {}) {
        const request = this.api.createAuthenticatedRequestData({
            channel_id: channelId,
            limit: options.limit || 50,
            offset: options.offset || 0,
            filter: options.filter,
            sorting: options.sorting,
            search: options.search,
        });
        try {
            const response = await this.api.post('/channels/members', request);
            return response.members || [];
        }
        catch (error) {
            throw new Error(`Failed to get channel members: ${error instanceof Error ? error.message : error}`);
        }
    }
    /** Remove a user from a channel */
    async removeUser(channelId, userId) {
        const request = this.api.createAuthenticatedRequestData({ channel_id: channelId, user_id: userId });
        try {
            await this.api.post('/channels/removeUser', request);
        }
        catch (error) {
            throw new Error(`Failed to remove user from channel: ${error instanceof Error ? error.message : error}`);
        }
    }
    /** Grant moderator status to a user */
    async addModeratorStatus(channelId, userId) {
        const request = this.api.createAuthenticatedRequestData({ channel_id: channelId, user_id: userId });
        try {
            await this.api.post('/channels/addModeratorStatus', request);
        }
        catch (error) {
            throw new Error(`Failed to add moderator status: ${error instanceof Error ? error.message : error}`);
        }
    }
    /** Revoke moderator status from a user */
    async removeModeratorStatus(channelId, userId) {
        const request = this.api.createAuthenticatedRequestData({ channel_id: channelId, user_id: userId });
        try {
            await this.api.post('/channels/removeModeratorStatus', request);
        }
        catch (error) {
            throw new Error(`Failed to remove moderator status: ${error instanceof Error ? error.message : error}`);
        }
    }
    /** Set channel as favorite */
    async setFavorite(channelId, favorite) {
        const request = this.api.createAuthenticatedRequestData({ channel_id: channelId, favorite });
        try {
            await this.api.post('/message/set_favorite', request);
        }
        catch (error) {
            throw new Error(`Failed to set channel favorite: ${error instanceof Error ? error.message : error}`);
        }
    }
    /** Enable push notifications for a channel */
    async enableNotifications(channelId) {
        const request = this.api.createAuthenticatedRequestData({ type: 'channel', content_id: channelId });
        try {
            await this.api.post('/push/enable_notifications', request);
        }
        catch (error) {
            throw new Error(`Failed to enable notifications: ${error instanceof Error ? error.message : error}`);
        }
    }
    /** Disable push notifications for a channel */
    async disableNotifications(channelId, duration) {
        const request = this.api.createAuthenticatedRequestData({
            type: 'channel',
            content_id: channelId,
            duration,
        });
        try {
            await this.api.post('/push/disable_notifications', request);
        }
        catch (error) {
            throw new Error(`Failed to disable notifications: ${error instanceof Error ? error.message : error}`);
        }
    }
}
exports.ChannelManager = ChannelManager;
//# sourceMappingURL=channels.js.map