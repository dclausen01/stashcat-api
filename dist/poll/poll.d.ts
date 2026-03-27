import { StashcatAPI } from '../api/request';
import { Poll, PollListItem, PollQuestion, PollAnswer, PollUser, PollConstraint, PollInviteTarget, CreatePollOptions, EditPollOptions, CreateQuestionOptions, EditQuestionOptions, CreateAnswerOptions, EditAnswerOptions } from './types';
export declare class PollManager {
    private api;
    constructor(api: StashcatAPI);
    /**
     * List polls for the current user.
     * @param constraint Filter: 'createdByAndNotArchived', 'invited', 'archived', etc.
     * @param companyId Company ID (optional, uses current company if omitted server-side)
     */
    listPolls(constraint: PollConstraint, companyId?: string): Promise<PollListItem[]>;
    /**
     * Get full poll details including questions.
     */
    getPollDetails(pollId: string, companyId: string): Promise<Poll>;
    /**
     * Create a new poll (initially as draft).
     */
    createPoll(options: CreatePollOptions): Promise<Poll>;
    /**
     * Edit an existing poll.
     */
    editPoll(options: EditPollOptions): Promise<void>;
    /**
     * Delete a poll.
     */
    deletePoll(pollId: string): Promise<boolean>;
    /**
     * Publish a draft poll (makes it active).
     */
    publishPoll(pollId: string): Promise<boolean>;
    /**
     * Archive or unarchive a poll.
     * @param archive true to archive, false to unarchive
     */
    archivePoll(pollId: string, archive: boolean): Promise<boolean>;
    /**
     * Watch or unwatch a poll (receive notifications on changes).
     */
    watchPoll(pollId: string, watch: boolean): Promise<boolean>;
    /**
     * Invite users or channels to a poll.
     * @param inviteTo Target type: 'channels' or 'users'
     * @param inviteIds IDs of users or channels to invite
     */
    inviteToPoll(pollId: string, companyId: string, inviteTo: PollInviteTarget, inviteIds: string[]): Promise<void>;
    /**
     * List users invited to a poll.
     */
    listInvitedUsers(pollId: string): Promise<PollUser[]>;
    /**
     * List invites (channels/users) for a poll.
     */
    listInvites(pollId: string, type?: PollInviteTarget, offset?: number, limit?: number): Promise<unknown[]>;
    /**
     * List participants who have answered a poll.
     */
    listParticipants(pollId: string): Promise<PollUser[]>;
    /**
     * Export poll results as CSV.
     * @returns Raw CSV string
     */
    exportPoll(pollId: string): Promise<Buffer>;
    /**
     * Create a question within a poll.
     */
    createQuestion(options: CreateQuestionOptions): Promise<PollQuestion>;
    /**
     * Edit an existing question.
     */
    editQuestion(options: EditQuestionOptions): Promise<PollQuestion>;
    /**
     * Delete a question from a poll.
     */
    deleteQuestion(companyId: string, questionId: string): Promise<boolean>;
    /**
     * List answers for a question.
     */
    listAnswers(questionId: string): Promise<PollAnswer[]>;
    /**
     * Create an answer option for a question.
     */
    createAnswer(options: CreateAnswerOptions): Promise<PollAnswer>;
    /**
     * Edit an existing answer option.
     */
    editAnswer(options: EditAnswerOptions): Promise<PollAnswer>;
    /**
     * Delete an answer option.
     */
    deleteAnswer(companyId: string, answerId: string): Promise<boolean>;
    /**
     * Submit the user's selected answers for a question.
     * @param questionId The question to answer
     * @param answerIds IDs of selected answer options
     */
    storeUserAnswers(questionId: string, answerIds: string[]): Promise<unknown>;
}
//# sourceMappingURL=poll.d.ts.map