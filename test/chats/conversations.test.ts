import { describe, it, expect, jest } from '@jest/globals';
import { ConversationManager } from '../../src/chats/conversations';
import { StashcatAPI } from '../../src/api/request';

function makeApi(postMock: jest.Mock): StashcatAPI {
  const api = Object.create(StashcatAPI.prototype) as StashcatAPI;
  (api as any).createAuthenticatedRequestData = (params: Record<string, unknown>) => params;
  (api as any).post = postMock;
  return api;
}

describe('ConversationManager.archiveConversation', () => {
  it('calls /message/archiveConversation with the conversation id', async () => {
    const post = jest.fn<() => Promise<void>>().mockResolvedValue(undefined);
    const manager = new ConversationManager(makeApi(post));

    await manager.archiveConversation('123');

    expect(post).toHaveBeenCalledTimes(1);
    expect(post).toHaveBeenCalledWith('/message/archiveConversation', {
      conversation_id: '123',
    });
  });

  it('wraps API errors with a descriptive message', async () => {
    const post = jest.fn<() => Promise<void>>().mockRejectedValue(new Error('forbidden'));
    const manager = new ConversationManager(makeApi(post));

    await expect(manager.archiveConversation('123')).rejects.toThrow(
      'Failed to archive conversation: forbidden'
    );
  });
});
