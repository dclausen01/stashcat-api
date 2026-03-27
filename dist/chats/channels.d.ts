import { StashcatAPI } from '../api/request';
import { Channel, ChannelMember, PaginationOptions } from './types';
export interface CreateChannelOptions {
    channel_name: string;
    company: string;
    description?: string;
    /** 'public' | 'private' */
    type?: string;
    visible?: boolean;
    writable?: boolean;
    inviteable?: boolean;
    password?: string;
    password_repeat?: string;
    encryption_key?: string;
    show_activities?: boolean;
    show_membership_activities?: boolean;
}
export interface EditChannelOptions {
    channel_id: string;
    company_id: string;
    channel_name?: string;
    description?: string;
    writable?: boolean;
    visible?: boolean;
    inviteable?: boolean;
    password?: string;
    password_repeat?: string;
    show_activities?: boolean;
    show_membership_activities?: boolean;
}
export interface ChannelMembersOptions extends PaginationOptions {
    filter?: string;
    search?: string;
}
export declare class ChannelManager {
    private api;
    constructor(api: StashcatAPI);
    /** Get all subscribed channels for a company */
    getChannels(companyId: string): Promise<Channel[]>;
    /** Get public/visible channels for a company (discovery) */
    getVisibleChannels(companyId: string, options?: {
        limit?: number;
        offset?: number;
        search?: string;
    }): Promise<Channel[]>;
    /** Get detailed channel info including members */
    getChannelInfo(channelId: string, withoutMembers?: boolean): Promise<Channel>;
    /** Create a new channel */
    createChannel(options: CreateChannelOptions): Promise<Channel>;
    /** Edit an existing channel */
    editChannel(options: EditChannelOptions): Promise<Channel>;
    /** Delete a channel */
    deleteChannel(channelId: string): Promise<void>;
    /** Join a channel (optionally with password) */
    joinChannel(channelId: string, password?: string): Promise<void>;
    /** Leave a channel */
    quitChannel(channelId: string): Promise<void>;
    /** Invite users to a channel */
    inviteUsers(channelId: string, userIds: string[], text?: string): Promise<void>;
    /** Accept a channel invitation */
    acceptInvite(inviteId: string): Promise<void>;
    /** Decline a channel invitation */
    declineInvite(inviteId: string): Promise<void>;
    /** Get channel members with pagination and filtering */
    getChannelMembers(channelId: string, options?: ChannelMembersOptions): Promise<ChannelMember[]>;
    /** Remove a user from a channel */
    removeUser(channelId: string, userId: string): Promise<void>;
    /** Grant moderator status to a user */
    addModeratorStatus(channelId: string, userId: string): Promise<void>;
    /** Revoke moderator status from a user */
    removeModeratorStatus(channelId: string, userId: string): Promise<void>;
    /** Set channel as favorite */
    setFavorite(channelId: string, favorite: boolean): Promise<void>;
    /** Enable push notifications for a channel */
    enableNotifications(channelId: string): Promise<void>;
    /** Disable push notifications for a channel */
    disableNotifications(channelId: string, duration?: number): Promise<void>;
}
//# sourceMappingURL=channels.d.ts.map