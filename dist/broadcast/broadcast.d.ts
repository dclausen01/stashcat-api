import { StashcatAPI } from '../api/request';
import { Message } from '../chats/types';
import { Broadcast, BroadcastContentOptions, SendBroadcastOptions, BroadcastMemberSortField } from './types';
export declare class BroadcastManager {
    private api;
    constructor(api: StashcatAPI);
    /**
     * List all broadcast lists owned by or accessible to the user.
     */
    listBroadcasts(): Promise<Broadcast[]>;
    /**
     * Create a new broadcast list.
     * @param name Name of the broadcast list
     * @param memberIds User IDs to add as members
     * @returns The created broadcast list
     */
    createBroadcast(name: string, memberIds: string[]): Promise<Broadcast>;
    /**
     * Delete a broadcast list.
     */
    deleteBroadcast(listId: string): Promise<void>;
    /**
     * Rename a broadcast list.
     */
    renameBroadcast(listId: string, name: string): Promise<void>;
    /**
     * Add members to a broadcast list.
     */
    addMembers(listId: string, memberIds: string[]): Promise<void>;
    /**
     * Remove members from a broadcast list.
     */
    removeMembers(listId: string, memberIds: string[]): Promise<void>;
    /**
     * List members of a broadcast list.
     * @param sorting Sort fields, e.g. ['firstName', 'lastName']
     */
    listMembers(listId: string, sorting?: BroadcastMemberSortField[]): Promise<unknown[]>;
    /**
     * Get messages (content) from a broadcast list.
     */
    getContent(options: BroadcastContentOptions): Promise<Message[]>;
    /**
     * Send a message to all members of a broadcast list.
     * @returns The sent message
     */
    sendMessage(options: SendBroadcastOptions): Promise<Message>;
}
//# sourceMappingURL=broadcast.d.ts.map