import { describe, it, expect, jest } from '@jest/globals';
import { MessageManager } from '../../src/chats/messages';
import { StashcatAPI } from '../../src/api/request';

function makeApi(postMock: jest.Mock): StashcatAPI {
  const api = Object.create(StashcatAPI.prototype) as StashcatAPI;
  (api as any).createAuthenticatedRequestData = (params: Record<string, unknown>) => params;
  (api as any).post = postMock;
  return api;
}

describe('MessageManager.markChatAsUnread', () => {
  it('calls /message/mark_chat_as_unread with channel type and id', async () => {
    const post = jest.fn<() => Promise<void>>().mockResolvedValue(undefined);
    const manager = new MessageManager(makeApi(post));

    await manager.markChatAsUnread('channel', '42');

    expect(post).toHaveBeenCalledTimes(1);
    expect(post).toHaveBeenCalledWith('/message/mark_chat_as_unread', {
      chat_type: 'channel',
      chat_id: '42',
    });
  });

  it('calls /message/mark_chat_as_unread with conversation type and id', async () => {
    const post = jest.fn<() => Promise<void>>().mockResolvedValue(undefined);
    const manager = new MessageManager(makeApi(post));

    await manager.markChatAsUnread('conversation', '99');

    expect(post).toHaveBeenCalledWith('/message/mark_chat_as_unread', {
      chat_type: 'conversation',
      chat_id: '99',
    });
  });

  it('wraps API errors with a descriptive message', async () => {
    const post = jest.fn<() => Promise<void>>().mockRejectedValue(new Error('network error'));
    const manager = new MessageManager(makeApi(post));

    await expect(manager.markChatAsUnread('channel', '1')).rejects.toThrow(
      'Failed to mark chat as unread: network error'
    );
  });
});
