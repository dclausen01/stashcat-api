import { StashcatAPI } from '../api/request';
import { Channel } from '../chats/types';
import { CalendarEvent, CreateEventOptions, EditEventOptions, ListEventsOptions, EventInviteStatus, AvailableCalendar } from './types';
export declare class CalendarManager {
    private api;
    constructor(api: StashcatAPI);
    /**
     * List events within a time range.
     * @param options start/end as Unix timestamps (seconds)
     */
    listEvents(options: ListEventsOptions): Promise<CalendarEvent[]>;
    /**
     * Get details for specific events by their IDs.
     */
    getEventDetails(eventIds: string[]): Promise<CalendarEvent | null>;
    /**
     * Create a new calendar event.
     * Returns the created event ID.
     */
    createEvent(options: CreateEventOptions): Promise<string>;
    /**
     * Edit an existing calendar event.
     * Returns the event ID.
     */
    editEvent(options: EditEventOptions): Promise<string>;
    /**
     * Delete one or more events by their IDs.
     */
    deleteEvents(eventIds: string[]): Promise<void>;
    /**
     * Respond to an event invitation.
     * @param eventId The event to respond to
     * @param userId The user's own ID
     * @param status Response status: 'accepted', 'declined', or 'open'
     */
    respondToEvent(eventId: string, userId: string, status: EventInviteStatus): Promise<void>;
    /**
     * Invite users to an existing event.
     */
    inviteToEvent(eventId: string, userIds: string[]): Promise<void>;
    /**
     * List available calendars (CalDAV sync info).
     */
    listAvailableCalendars(): Promise<AvailableCalendar[]>;
    /**
     * List channels that have events (for a given company).
     */
    listChannelsHavingEvents(companyId: string): Promise<Channel[]>;
}
//# sourceMappingURL=calendar.d.ts.map