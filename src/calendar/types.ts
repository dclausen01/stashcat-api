/** Event types supported by the Stashcat calendar */
export type EventType = 'personal' | 'channel' | 'company';

/** Invite response status */
export type EventInviteStatus = 'accepted' | 'declined' | 'open';

/** Repeat frequency */
export type EventRepeat = 'none' | 'daily' | 'weekly' | 'monthly' | 'yearly' | string;

/** A calendar event */
export interface CalendarEvent {
  id: number;
  name: string;
  description?: string;
  location?: string;
  /** Unix timestamp (seconds) */
  start: number;
  /** Unix timestamp (seconds) */
  end: number;
  type: EventType;
  type_id?: number;
  allday?: string; // "0" or "1"
  repeat?: EventRepeat;
  repeat_end?: number | null;
  created_dst?: string; // "0" or "1"
  no_notification?: boolean;
  creator?: EventUser;
  modifier?: EventUser;
  last_modified?: string;
  invites?: EventInvite[];
  channel?: unknown;
  channel_invites?: unknown[];
  members?: unknown[];
  kind?: string;
}

/** Simplified user in event context */
export interface EventUser {
  id: number | string;
  first_name?: string;
  last_name?: string;
  name?: string;
  image?: string;
}

/** An invite to a calendar event */
export interface EventInvite {
  id: number;
  created: number;
  inviter?: EventUser;
  responded: number;
  status: EventInviteStatus;
  user: EventUser;
}

/** Options for creating or editing an event */
export interface CreateEventOptions {
  name: string;
  /** Unix timestamp (seconds) */
  start: number;
  /** Unix timestamp (seconds) */
  end: number;
  type: EventType;
  /** Required for channel/company types — the channel or company ID */
  type_id?: string;
  company_id: string;
  description?: string;
  location?: string;
  allday?: boolean;
  no_notification?: boolean;
  repeat?: EventRepeat;
  /** Unix timestamp (seconds) — when repeating ends */
  repeat_end?: number;
  /** User IDs to invite */
  invite_user_ids?: string[];
  /** Channel IDs to invite */
  invite_channel_ids?: string[];
  /** Daylight saving flag */
  created_dst?: boolean;
}

/** Options for editing an existing event (same as create but with event_id) */
export interface EditEventOptions extends CreateEventOptions {
  event_id: string;
}

/** Options for listing events */
export interface ListEventsOptions {
  /** Unix timestamp (seconds) — range start */
  start: number;
  /** Unix timestamp (seconds) — range end */
  end: number;
}

/** Available calendar info returned by list_available_calendars */
export interface AvailableCalendar {
  url?: string;
  url_apple?: string;
  [key: string]: unknown;
}
