"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CalendarManager = void 0;
class CalendarManager {
    constructor(api) {
        this.api = api;
    }
    /**
     * List events within a time range.
     * @param options start/end as Unix timestamps (seconds)
     */
    async listEvents(options) {
        const data = this.api.createAuthenticatedRequestData({
            start: options.start,
            end: options.end,
        });
        try {
            const response = await this.api.post('/events/list', data);
            return response.events || [];
        }
        catch (error) {
            throw new Error(`Failed to list events: ${error instanceof Error ? error.message : error}`);
        }
    }
    /**
     * Get details for specific events by their IDs.
     */
    async getEventDetails(eventIds) {
        const data = this.api.createAuthenticatedRequestData({
            event_ids: JSON.stringify(eventIds),
        });
        try {
            const response = await this.api.post('/events/details', data);
            if (response.success === false)
                return null;
            return response.events?.[0] || null;
        }
        catch (error) {
            throw new Error(`Failed to get event details: ${error instanceof Error ? error.message : error}`);
        }
    }
    /**
     * Create a new calendar event.
     * Returns the created event ID.
     */
    async createEvent(options) {
        const data = this.api.createAuthenticatedRequestData({
            start: options.start,
            end: options.end,
            name: options.name,
            location: options.location || '',
            description: options.description || '',
            type: options.type,
            type_id: options.type_id || '',
            company_id: options.company_id,
            allday: options.allday ? '1' : '0',
            no_notification: options.no_notification ? '1' : '0',
            repeat: options.repeat || 'none',
            repeat_end: options.repeat_end || '',
            invite_user_ids: JSON.stringify(options.invite_user_ids || []),
            invite_channel_ids: JSON.stringify(options.invite_channel_ids || []),
            created_dst: options.created_dst ? '1' : '0',
        });
        try {
            const response = await this.api.post('/events/create', data);
            return response.event.id;
        }
        catch (error) {
            throw new Error(`Failed to create event: ${error instanceof Error ? error.message : error}`);
        }
    }
    /**
     * Edit an existing calendar event.
     * Returns the event ID.
     */
    async editEvent(options) {
        const data = this.api.createAuthenticatedRequestData({
            event_id: options.event_id,
            start: options.start,
            end: options.end,
            name: options.name,
            location: options.location || '',
            description: options.description || '',
            type: options.type,
            type_id: options.type_id || '',
            company_id: options.company_id,
            allday: options.allday ? '1' : '0',
            no_notification: options.no_notification ? '1' : '0',
            repeat: options.repeat || 'none',
            repeat_end: options.repeat_end || '',
            invite_user_ids: JSON.stringify(options.invite_user_ids || []),
            invite_channel_ids: JSON.stringify(options.invite_channel_ids || []),
            created_dst: options.created_dst ? '1' : '0',
        });
        try {
            const response = await this.api.post('/events/edit', data);
            return response.event.id;
        }
        catch (error) {
            throw new Error(`Failed to edit event: ${error instanceof Error ? error.message : error}`);
        }
    }
    /**
     * Delete one or more events by their IDs.
     */
    async deleteEvents(eventIds) {
        const data = this.api.createAuthenticatedRequestData({
            event_ids: JSON.stringify(eventIds),
        });
        try {
            await this.api.post('/events/delete', data);
        }
        catch (error) {
            throw new Error(`Failed to delete events: ${error instanceof Error ? error.message : error}`);
        }
    }
    /**
     * Respond to an event invitation.
     * @param eventId The event to respond to
     * @param userId The user's own ID
     * @param status Response status: 'accepted', 'declined', or 'open'
     */
    async respondToEvent(eventId, userId, status) {
        const data = this.api.createAuthenticatedRequestData({
            event_id: eventId,
            user_id: userId,
            status,
        });
        try {
            await this.api.post('/events/respond', data);
        }
        catch (error) {
            throw new Error(`Failed to respond to event: ${error instanceof Error ? error.message : error}`);
        }
    }
    /**
     * Invite users to an existing event.
     */
    async inviteToEvent(eventId, userIds) {
        const data = this.api.createAuthenticatedRequestData({
            event_id: eventId,
            user_ids: JSON.stringify(userIds),
        });
        try {
            await this.api.post('/events/invite', data);
        }
        catch (error) {
            throw new Error(`Failed to invite users to event: ${error instanceof Error ? error.message : error}`);
        }
    }
    /**
     * List available calendars (CalDAV sync info).
     */
    async listAvailableCalendars() {
        const data = this.api.createAuthenticatedRequestData({});
        try {
            const response = await this.api.post('/events/list_available_calendars', data);
            return response.available_calendars || [];
        }
        catch (error) {
            throw new Error(`Failed to list available calendars: ${error instanceof Error ? error.message : error}`);
        }
    }
    /**
     * List channels that have events (for a given company).
     */
    async listChannelsHavingEvents(companyId) {
        const data = this.api.createAuthenticatedRequestData({
            company_id: companyId,
        });
        try {
            const response = await this.api.post('/events/list_channels_having_events', data);
            return response.channels || [];
        }
        catch (error) {
            throw new Error(`Failed to list channels having events: ${error instanceof Error ? error.message : error}`);
        }
    }
}
exports.CalendarManager = CalendarManager;
//# sourceMappingURL=calendar.js.map