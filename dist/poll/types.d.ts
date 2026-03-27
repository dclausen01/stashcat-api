/** Privacy type for a poll */
export type PollPrivacyType = 'open' | 'hidden' | 'anonymous';
/** Constraint/filter for listing polls (live-verified 2026-03-27) */
export type PollConstraint = 'created_by_and_not_archived' | 'invited_and_not_archived' | 'archived_or_over' | string;
/** Invite target type for poll invitations */
export type PollInviteTarget = 'channels' | 'users' | string;
/** A poll (survey) as returned by /poll/list */
export interface PollListItem {
    id: number;
    creator_id: number;
    creator?: PollUser;
    name: string;
    description?: string;
    type?: string;
    hidden_results?: boolean;
    privacy_type?: PollPrivacyType;
    /** Unix timestamp (seconds) */
    start_time?: number;
    /** Unix timestamp (seconds) */
    end_time?: number;
    /** Unix timestamp (seconds) */
    created?: number;
    /** Unix timestamp (seconds) */
    modified?: number;
    /** Unix timestamp (seconds) — null if draft */
    published_at?: number | null;
    invited_users_count?: number;
    participants_count?: number;
    /** Unix timestamp (seconds) — when the current user participated */
    participated_at?: number | null;
    is_watched?: boolean;
    company_id?: number;
}
/** Full poll details as returned by /poll/details */
export interface Poll extends PollListItem {
    participants?: PollUser[];
    invited_users?: PollUser[];
    questions?: PollQuestion[];
}
/** A user reference within a poll context */
export interface PollUser {
    id: number | string;
    first_name?: string;
    last_name?: string;
    name?: string;
    image?: string;
}
/** A question within a poll */
export interface PollQuestion {
    id: number;
    name: string;
    /** Question type, e.g. 'text' */
    type: string;
    answer_limit?: number | null;
    /** Unix timestamp (seconds) */
    created?: number;
    /** Unix timestamp (seconds) */
    modified?: number;
}
/** An answer option within a question */
export interface PollAnswer {
    id: number;
    type?: string;
    allday?: boolean;
    /** Unix timestamp (seconds) */
    start_time?: number | null;
    /** Unix timestamp (seconds) */
    end_time?: number | null;
    answer_count?: number;
    answer_text?: string;
    answer_limit?: number | null;
    answer_limit_reached?: boolean;
    /** Unix timestamp (seconds) */
    created?: number;
    /** Unix timestamp (seconds) */
    modified?: number;
    users?: PollUser[];
    is_selected?: boolean;
}
/** Options for creating a poll */
export interface CreatePollOptions {
    company_id: string;
    name: string;
    description?: string;
    hidden_results?: boolean;
    privacy_type?: PollPrivacyType;
    /** Unix timestamp (seconds) */
    start_time: number;
    /** Unix timestamp (seconds) */
    end_time: number;
}
/** Options for editing a poll */
export interface EditPollOptions extends CreatePollOptions {
    poll_id: string;
}
/** Options for creating a question */
export interface CreateQuestionOptions {
    company_id: string;
    poll_id: string;
    name: string;
    type: string;
    answer_limit?: number;
    position?: number;
}
/** Options for editing a question */
export interface EditQuestionOptions {
    company_id: string;
    question_id: string;
    name: string;
    answer_limit?: number;
    position?: number;
}
/** Options for creating an answer */
export interface CreateAnswerOptions {
    company_id: string;
    question_id: string;
    type: string;
    allday?: boolean;
    /** Unix timestamp (seconds) */
    start_time?: number;
    /** Unix timestamp (seconds) */
    end_time?: number;
    answer_text?: string;
    answer_limit?: number;
    position?: number;
}
/** Options for editing an answer */
export interface EditAnswerOptions {
    company_id: string;
    answer_id: string;
    allday?: boolean;
    /** Unix timestamp (seconds) */
    start_time?: number;
    /** Unix timestamp (seconds) */
    end_time?: number;
    answer_text?: string;
    answer_limit?: number;
    position?: number;
}
//# sourceMappingURL=types.d.ts.map