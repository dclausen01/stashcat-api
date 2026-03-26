import { StashcatAPI } from '../api/request';
import {
  Poll,
  PollListItem,
  PollQuestion,
  PollAnswer,
  PollUser,
  PollConstraint,
  PollInviteTarget,
  CreatePollOptions,
  EditPollOptions,
  CreateQuestionOptions,
  EditQuestionOptions,
  CreateAnswerOptions,
  EditAnswerOptions,
} from './types';

export class PollManager {
  constructor(private api: StashcatAPI) {}

  /**
   * List polls for the current user.
   * @param constraint Filter: 'createdByAndNotArchived', 'invited', 'archived', etc.
   * @param companyId Company ID (optional, uses current company if omitted server-side)
   */
  async listPolls(constraint: PollConstraint, companyId?: string): Promise<PollListItem[]> {
    const data = this.api.createAuthenticatedRequestData({
      constraint,
      ...(companyId ? { company_id: companyId } : {}),
    });
    try {
      const response = await this.api.post<{ polls: PollListItem[] }>('/poll/list', data);
      return response.polls || [];
    } catch (error) {
      throw new Error(`Failed to list polls: ${error instanceof Error ? error.message : error}`);
    }
  }

  /**
   * Get full poll details including questions.
   */
  async getPollDetails(pollId: string, companyId: string): Promise<Poll> {
    const data = this.api.createAuthenticatedRequestData({
      poll_id: pollId,
      company_id: companyId,
    });
    try {
      const response = await this.api.post<{ poll: Poll }>('/poll/details', data);
      return response.poll;
    } catch (error) {
      throw new Error(`Failed to get poll details: ${error instanceof Error ? error.message : error}`);
    }
  }

  /**
   * Create a new poll (initially as draft).
   */
  async createPoll(options: CreatePollOptions): Promise<Poll> {
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
      const response = await this.api.post<{ poll: Poll }>('/poll/create', data);
      return response.poll;
    } catch (error) {
      throw new Error(`Failed to create poll: ${error instanceof Error ? error.message : error}`);
    }
  }

  /**
   * Edit an existing poll.
   */
  async editPoll(options: EditPollOptions): Promise<void> {
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
      await this.api.post<unknown>('/poll/edit', data);
    } catch (error) {
      throw new Error(`Failed to edit poll: ${error instanceof Error ? error.message : error}`);
    }
  }

  /**
   * Delete a poll.
   */
  async deletePoll(pollId: string): Promise<boolean> {
    const data = this.api.createAuthenticatedRequestData({
      poll_id: pollId,
    });
    try {
      const response = await this.api.post<{ success: boolean }>('/poll/delete', data);
      return response.success;
    } catch (error) {
      throw new Error(`Failed to delete poll: ${error instanceof Error ? error.message : error}`);
    }
  }

  /**
   * Publish a draft poll (makes it active).
   */
  async publishPoll(pollId: string): Promise<boolean> {
    const data = this.api.createAuthenticatedRequestData({
      poll_id: pollId,
    });
    try {
      const response = await this.api.post<{ success: boolean }>('/poll/publish', data);
      return response.success;
    } catch (error) {
      throw new Error(`Failed to publish poll: ${error instanceof Error ? error.message : error}`);
    }
  }

  /**
   * Archive or unarchive a poll.
   * @param archive true to archive, false to unarchive
   */
  async archivePoll(pollId: string, archive: boolean): Promise<boolean> {
    const data = this.api.createAuthenticatedRequestData({
      poll_id: pollId,
      archive,
    });
    try {
      const response = await this.api.post<{ success: boolean }>('/poll/archive', data);
      return response.success;
    } catch (error) {
      throw new Error(`Failed to archive poll: ${error instanceof Error ? error.message : error}`);
    }
  }

  /**
   * Watch or unwatch a poll (receive notifications on changes).
   */
  async watchPoll(pollId: string, watch: boolean): Promise<boolean> {
    const data = this.api.createAuthenticatedRequestData({
      poll_id: pollId,
      watch,
    });
    try {
      const response = await this.api.post<{ success: boolean }>('/poll/watch', data);
      return response.success;
    } catch (error) {
      throw new Error(`Failed to watch/unwatch poll: ${error instanceof Error ? error.message : error}`);
    }
  }

  /**
   * Invite users or channels to a poll.
   * @param inviteTo Target type: 'channels' or 'users'
   * @param inviteIds IDs of users or channels to invite
   */
  async inviteToPoll(pollId: string, companyId: string, inviteTo: PollInviteTarget, inviteIds: string[]): Promise<void> {
    const data = this.api.createAuthenticatedRequestData({
      company_id: companyId,
      poll_id: pollId,
      invite_to: inviteTo,
      invite_ids: JSON.stringify(inviteIds),
    });
    try {
      await this.api.post<unknown>('/poll/invite', data);
    } catch (error) {
      throw new Error(`Failed to invite to poll: ${error instanceof Error ? error.message : error}`);
    }
  }

  /**
   * List users invited to a poll.
   */
  async listInvitedUsers(pollId: string): Promise<PollUser[]> {
    const data = this.api.createAuthenticatedRequestData({
      poll_id: pollId,
    });
    try {
      const response = await this.api.post<{ invited_users: PollUser[] }>('/poll/list_invited_users', data);
      return response.invited_users || [];
    } catch (error) {
      throw new Error(`Failed to list invited users: ${error instanceof Error ? error.message : error}`);
    }
  }

  /**
   * List invites (channels/users) for a poll.
   */
  async listInvites(pollId: string, type: PollInviteTarget = 'channels', offset?: number, limit?: number): Promise<unknown[]> {
    const data = this.api.createAuthenticatedRequestData({
      poll_id: pollId,
      type,
      ...(offset !== undefined ? { offset } : {}),
      ...(limit !== undefined ? { limit } : {}),
    });
    try {
      const response = await this.api.post<{ invites: unknown[] }>('/poll/list_invites', data);
      return response.invites || [];
    } catch (error) {
      throw new Error(`Failed to list poll invites: ${error instanceof Error ? error.message : error}`);
    }
  }

  /**
   * List participants who have answered a poll.
   */
  async listParticipants(pollId: string): Promise<PollUser[]> {
    const data = this.api.createAuthenticatedRequestData({
      poll_id: pollId,
    });
    try {
      const response = await this.api.post<{ participants: PollUser[] }>('/poll/list_participants', data);
      return response.participants || [];
    } catch (error) {
      throw new Error(`Failed to list poll participants: ${error instanceof Error ? error.message : error}`);
    }
  }

  /**
   * Export poll results as CSV.
   * @returns Raw CSV string
   */
  async exportPoll(pollId: string): Promise<Buffer> {
    const data = this.api.createAuthenticatedRequestData({
      poll_id: pollId,
    });
    try {
      const response = await this.api.post<Buffer>('/poll/export', data);
      return response;
    } catch (error) {
      throw new Error(`Failed to export poll: ${error instanceof Error ? error.message : error}`);
    }
  }

  // ── Question management ──

  /**
   * Create a question within a poll.
   */
  async createQuestion(options: CreateQuestionOptions): Promise<PollQuestion> {
    const data = this.api.createAuthenticatedRequestData({
      company_id: options.company_id,
      poll_id: options.poll_id,
      name: options.name,
      type: options.type,
      ...(options.answer_limit !== undefined ? { answer_limit: options.answer_limit } : {}),
      ...(options.position !== undefined ? { position: options.position } : {}),
    });
    try {
      const response = await this.api.post<{ question: PollQuestion }>('/poll/create_question', data);
      return response.question;
    } catch (error) {
      throw new Error(`Failed to create question: ${error instanceof Error ? error.message : error}`);
    }
  }

  /**
   * Edit an existing question.
   */
  async editQuestion(options: EditQuestionOptions): Promise<PollQuestion> {
    const data = this.api.createAuthenticatedRequestData({
      company_id: options.company_id,
      question_id: options.question_id,
      name: options.name,
      ...(options.answer_limit !== undefined ? { answer_limit: options.answer_limit } : {}),
      ...(options.position !== undefined ? { position: options.position } : {}),
    });
    try {
      const response = await this.api.post<{ question: PollQuestion }>('/poll/edit_question', data);
      return response.question;
    } catch (error) {
      throw new Error(`Failed to edit question: ${error instanceof Error ? error.message : error}`);
    }
  }

  /**
   * Delete a question from a poll.
   */
  async deleteQuestion(companyId: string, questionId: string): Promise<boolean> {
    const data = this.api.createAuthenticatedRequestData({
      company_id: companyId,
      question_id: questionId,
    });
    try {
      const response = await this.api.post<{ success: boolean }>('/poll/delete_question', data);
      return response.success;
    } catch (error) {
      throw new Error(`Failed to delete question: ${error instanceof Error ? error.message : error}`);
    }
  }

  // ── Answer management ──

  /**
   * List answers for a question.
   */
  async listAnswers(questionId: string): Promise<PollAnswer[]> {
    const data = this.api.createAuthenticatedRequestData({
      question_id: questionId,
    });
    try {
      const response = await this.api.post<{ answers: PollAnswer[] }>('/poll/list_answers', data);
      return response.answers || [];
    } catch (error) {
      throw new Error(`Failed to list answers: ${error instanceof Error ? error.message : error}`);
    }
  }

  /**
   * Create an answer option for a question.
   */
  async createAnswer(options: CreateAnswerOptions): Promise<PollAnswer> {
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
      const response = await this.api.post<{ answer: PollAnswer }>('/poll/create_answer', data);
      return response.answer;
    } catch (error) {
      throw new Error(`Failed to create answer: ${error instanceof Error ? error.message : error}`);
    }
  }

  /**
   * Edit an existing answer option.
   */
  async editAnswer(options: EditAnswerOptions): Promise<PollAnswer> {
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
      const response = await this.api.post<{ answer: PollAnswer }>('/poll/edit_answer', data);
      return response.answer;
    } catch (error) {
      throw new Error(`Failed to edit answer: ${error instanceof Error ? error.message : error}`);
    }
  }

  /**
   * Delete an answer option.
   */
  async deleteAnswer(companyId: string, answerId: string): Promise<boolean> {
    const data = this.api.createAuthenticatedRequestData({
      company_id: companyId,
      answer_id: answerId,
    });
    try {
      const response = await this.api.post<{ success: boolean }>('/poll/delete_answer', data);
      return response.success;
    } catch (error) {
      throw new Error(`Failed to delete answer: ${error instanceof Error ? error.message : error}`);
    }
  }

  /**
   * Submit the user's selected answers for a question.
   * @param questionId The question to answer
   * @param answerIds IDs of selected answer options
   */
  async storeUserAnswers(questionId: string, answerIds: string[]): Promise<unknown> {
    const data = this.api.createAuthenticatedRequestData({
      question_id: questionId,
      answer_ids: JSON.stringify(answerIds),
    });
    try {
      const response = await this.api.post<{ success: boolean; user_answers?: unknown }>('/poll/store_user_answers', data);
      return response.user_answers ?? response.success;
    } catch (error) {
      throw new Error(`Failed to store user answers: ${error instanceof Error ? error.message : error}`);
    }
  }
}
