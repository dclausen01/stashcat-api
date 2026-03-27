"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PollManager = void 0;
class PollManager {
    constructor(api) {
        this.api = api;
    }
    /**
     * List polls for the current user.
     * @param constraint Filter: 'createdByAndNotArchived', 'invited', 'archived', etc.
     * @param companyId Company ID (optional, uses current company if omitted server-side)
     */
    async listPolls(constraint, companyId) {
        const data = this.api.createAuthenticatedRequestData({
            constraint,
            ...(companyId ? { company_id: companyId } : {}),
        });
        try {
            const response = await this.api.post('/poll/list', data);
            return response.polls || [];
        }
        catch (error) {
            throw new Error(`Failed to list polls: ${error instanceof Error ? error.message : error}`);
        }
    }
    /**
     * Get full poll details including questions.
     */
    async getPollDetails(pollId, companyId) {
        const data = this.api.createAuthenticatedRequestData({
            poll_id: pollId,
            company_id: companyId,
        });
        try {
            const response = await this.api.post('/poll/details', data);
            return response.poll;
        }
        catch (error) {
            throw new Error(`Failed to get poll details: ${error instanceof Error ? error.message : error}`);
        }
    }
    /**
     * Create a new poll (initially as draft).
     */
    async createPoll(options) {
        const data = this.api.createAuthenticatedRequestData({
            company_id: options.company_id,
            name: options.name,
            ...(options.description ? { description: options.description } : {}),
            ...(options.hidden_results !== undefined ? { hidden_results: options.hidden_results } : {}),
            ...(options.privacy_type ? { privacy_type: options.privacy_type } : {}),
            start_time: options.start_time,
            end_time: options.end_time,
        });
        try {
            const response = await this.api.post('/poll/create', data);
            return response.poll;
        }
        catch (error) {
            throw new Error(`Failed to create poll: ${error instanceof Error ? error.message : error}`);
        }
    }
    /**
     * Edit an existing poll.
     */
    async editPoll(options) {
        const data = this.api.createAuthenticatedRequestData({
            company_id: options.company_id,
            poll_id: options.poll_id,
            name: options.name,
            ...(options.description !== undefined ? { description: options.description } : {}),
            ...(options.hidden_results !== undefined ? { hidden_results: options.hidden_results } : {}),
            ...(options.privacy_type ? { privacy_type: options.privacy_type } : {}),
            start_time: options.start_time,
            end_time: options.end_time,
        });
        try {
            await this.api.post('/poll/edit', data);
        }
        catch (error) {
            throw new Error(`Failed to edit poll: ${error instanceof Error ? error.message : error}`);
        }
    }
    /**
     * Delete a poll.
     */
    async deletePoll(pollId) {
        const data = this.api.createAuthenticatedRequestData({
            poll_id: pollId,
        });
        try {
            const response = await this.api.post('/poll/delete', data);
            return response.success;
        }
        catch (error) {
            throw new Error(`Failed to delete poll: ${error instanceof Error ? error.message : error}`);
        }
    }
    /**
     * Publish a draft poll (makes it active).
     */
    async publishPoll(pollId) {
        const data = this.api.createAuthenticatedRequestData({
            poll_id: pollId,
        });
        try {
            const response = await this.api.post('/poll/publish', data);
            return response.success;
        }
        catch (error) {
            throw new Error(`Failed to publish poll: ${error instanceof Error ? error.message : error}`);
        }
    }
    /**
     * Archive or unarchive a poll.
     * @param archive true to archive, false to unarchive
     */
    async archivePoll(pollId, archive) {
        const data = this.api.createAuthenticatedRequestData({
            poll_id: pollId,
            archive,
        });
        try {
            const response = await this.api.post('/poll/archive', data);
            return response.success;
        }
        catch (error) {
            throw new Error(`Failed to archive poll: ${error instanceof Error ? error.message : error}`);
        }
    }
    /**
     * Watch or unwatch a poll (receive notifications on changes).
     */
    async watchPoll(pollId, watch) {
        const data = this.api.createAuthenticatedRequestData({
            poll_id: pollId,
            watch,
        });
        try {
            const response = await this.api.post('/poll/watch', data);
            return response.success;
        }
        catch (error) {
            throw new Error(`Failed to watch/unwatch poll: ${error instanceof Error ? error.message : error}`);
        }
    }
    /**
     * Invite users or channels to a poll.
     * @param inviteTo Target type: 'channels' or 'users'
     * @param inviteIds IDs of users or channels to invite
     */
    async inviteToPoll(pollId, companyId, inviteTo, inviteIds) {
        const data = this.api.createAuthenticatedRequestData({
            company_id: companyId,
            poll_id: pollId,
            invite_to: inviteTo,
            invite_ids: JSON.stringify(inviteIds),
        });
        try {
            await this.api.post('/poll/invite', data);
        }
        catch (error) {
            throw new Error(`Failed to invite to poll: ${error instanceof Error ? error.message : error}`);
        }
    }
    /**
     * List users invited to a poll.
     */
    async listInvitedUsers(pollId) {
        const data = this.api.createAuthenticatedRequestData({
            poll_id: pollId,
        });
        try {
            const response = await this.api.post('/poll/list_invited_users', data);
            return response.invited_users || [];
        }
        catch (error) {
            throw new Error(`Failed to list invited users: ${error instanceof Error ? error.message : error}`);
        }
    }
    /**
     * List invites (channels/users) for a poll.
     */
    async listInvites(pollId, type = 'channels', offset, limit) {
        const data = this.api.createAuthenticatedRequestData({
            poll_id: pollId,
            type,
            ...(offset !== undefined ? { offset } : {}),
            ...(limit !== undefined ? { limit } : {}),
        });
        try {
            const response = await this.api.post('/poll/list_invites', data);
            return response.invites || [];
        }
        catch (error) {
            throw new Error(`Failed to list poll invites: ${error instanceof Error ? error.message : error}`);
        }
    }
    /**
     * List participants who have answered a poll.
     */
    async listParticipants(pollId) {
        const data = this.api.createAuthenticatedRequestData({
            poll_id: pollId,
        });
        try {
            const response = await this.api.post('/poll/list_participants', data);
            return response.participants || [];
        }
        catch (error) {
            throw new Error(`Failed to list poll participants: ${error instanceof Error ? error.message : error}`);
        }
    }
    /**
     * Export poll results as CSV.
     * @returns Raw CSV string
     */
    async exportPoll(pollId) {
        const data = this.api.createAuthenticatedRequestData({
            poll_id: pollId,
        });
        try {
            const response = await this.api.post('/poll/export', data);
            return response;
        }
        catch (error) {
            throw new Error(`Failed to export poll: ${error instanceof Error ? error.message : error}`);
        }
    }
    // ── Question management ──
    /**
     * Create a question within a poll.
     */
    async createQuestion(options) {
        const data = this.api.createAuthenticatedRequestData({
            company_id: options.company_id,
            poll_id: options.poll_id,
            name: options.name,
            type: options.type,
            ...(options.answer_limit !== undefined ? { answer_limit: options.answer_limit } : {}),
            ...(options.position !== undefined ? { position: options.position } : {}),
        });
        try {
            const response = await this.api.post('/poll/create_question', data);
            return response.question;
        }
        catch (error) {
            throw new Error(`Failed to create question: ${error instanceof Error ? error.message : error}`);
        }
    }
    /**
     * Edit an existing question.
     */
    async editQuestion(options) {
        const data = this.api.createAuthenticatedRequestData({
            company_id: options.company_id,
            question_id: options.question_id,
            name: options.name,
            ...(options.answer_limit !== undefined ? { answer_limit: options.answer_limit } : {}),
            ...(options.position !== undefined ? { position: options.position } : {}),
        });
        try {
            const response = await this.api.post('/poll/edit_question', data);
            return response.question;
        }
        catch (error) {
            throw new Error(`Failed to edit question: ${error instanceof Error ? error.message : error}`);
        }
    }
    /**
     * Delete a question from a poll.
     */
    async deleteQuestion(companyId, questionId) {
        const data = this.api.createAuthenticatedRequestData({
            company_id: companyId,
            question_id: questionId,
        });
        try {
            const response = await this.api.post('/poll/delete_question', data);
            return response.success;
        }
        catch (error) {
            throw new Error(`Failed to delete question: ${error instanceof Error ? error.message : error}`);
        }
    }
    // ── Answer management ──
    /**
     * List answers for a question.
     */
    async listAnswers(questionId) {
        const data = this.api.createAuthenticatedRequestData({
            question_id: questionId,
        });
        try {
            const response = await this.api.post('/poll/list_answers', data);
            return response.answers || [];
        }
        catch (error) {
            throw new Error(`Failed to list answers: ${error instanceof Error ? error.message : error}`);
        }
    }
    /**
     * Create an answer option for a question.
     */
    async createAnswer(options) {
        const data = this.api.createAuthenticatedRequestData({
            company_id: options.company_id,
            question_id: options.question_id,
            type: options.type,
            ...(options.allday !== undefined ? { allday: options.allday } : {}),
            ...(options.start_time !== undefined ? { start_time: options.start_time } : {}),
            ...(options.end_time !== undefined ? { end_time: options.end_time } : {}),
            ...(options.answer_text !== undefined ? { answer_text: options.answer_text } : {}),
            ...(options.answer_limit !== undefined ? { answer_limit: options.answer_limit } : {}),
            ...(options.position !== undefined ? { position: options.position } : {}),
        });
        try {
            const response = await this.api.post('/poll/create_answer', data);
            return response.answer;
        }
        catch (error) {
            throw new Error(`Failed to create answer: ${error instanceof Error ? error.message : error}`);
        }
    }
    /**
     * Edit an existing answer option.
     */
    async editAnswer(options) {
        const data = this.api.createAuthenticatedRequestData({
            company_id: options.company_id,
            answer_id: options.answer_id,
            ...(options.allday !== undefined ? { allday: options.allday } : {}),
            ...(options.start_time !== undefined ? { start_time: options.start_time } : {}),
            ...(options.end_time !== undefined ? { end_time: options.end_time } : {}),
            ...(options.answer_text !== undefined ? { answer_text: options.answer_text } : {}),
            ...(options.answer_limit !== undefined ? { answer_limit: options.answer_limit } : {}),
            ...(options.position !== undefined ? { position: options.position } : {}),
        });
        try {
            const response = await this.api.post('/poll/edit_answer', data);
            return response.answer;
        }
        catch (error) {
            throw new Error(`Failed to edit answer: ${error instanceof Error ? error.message : error}`);
        }
    }
    /**
     * Delete an answer option.
     */
    async deleteAnswer(companyId, answerId) {
        const data = this.api.createAuthenticatedRequestData({
            company_id: companyId,
            answer_id: answerId,
        });
        try {
            const response = await this.api.post('/poll/delete_answer', data);
            return response.success;
        }
        catch (error) {
            throw new Error(`Failed to delete answer: ${error instanceof Error ? error.message : error}`);
        }
    }
    /**
     * Submit the user's selected answers for a question.
     * @param questionId The question to answer
     * @param answerIds IDs of selected answer options
     */
    async storeUserAnswers(questionId, answerIds) {
        const data = this.api.createAuthenticatedRequestData({
            question_id: questionId,
            answer_ids: JSON.stringify(answerIds),
        });
        try {
            const response = await this.api.post('/poll/store_user_answers', data);
            return response.user_answers ?? response.success;
        }
        catch (error) {
            throw new Error(`Failed to store user answers: ${error instanceof Error ? error.message : error}`);
        }
    }
}
exports.PollManager = PollManager;
//# sourceMappingURL=poll.js.map