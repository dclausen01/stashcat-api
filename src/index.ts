export { StashcatClient, StashcatClientConfig, SerializedSession } from './client/StashcatClient';
export { StashcatAPI, StashcatConfig } from './api/request';
export { APIResponse, APIStatus } from './api/response';

// Auth
export { AuthManager, AuthConfig, AuthState } from './auth/login';

// Chats
export { ChannelManager, CreateChannelOptions, EditChannelOptions, ChannelMembersOptions } from './chats/channels';
export { ConversationManager } from './chats/conversations';
export { MessageManager, SendMessageOptions } from './chats/messages';
export { Channel, ChannelMember, Conversation, ConversationParticipant, Message, MessageFile, MessageLiker, MessageSender, PaginationOptions } from './chats/types';

// Users
export { UserManager } from './users/users';
export { User, Company, CompanyMember, ManagedUser, CompanyGroup } from './users/types';

// Account
export { AccountManager } from './account/account';
export { AccountSettings, ActiveDevice, Notification } from './account/types';

// Files
export { FileManager } from './files/files';
export { FileInfo, FolderItem, FolderContent, FolderEntry, FileEntry, FolderListOptions, FileUploadOptions, FileQuota, FileStorageType } from './files/types';

// Broadcast
export { BroadcastManager } from './broadcast/broadcast';
export { Broadcast, BroadcastContentOptions, SendBroadcastOptions, BroadcastMemberSortField } from './broadcast/types';

// Calendar
export { CalendarManager } from './calendar/calendar';
export { CalendarEvent, EventType, EventInviteStatus, EventRepeat, EventInvite, EventUser, CreateEventOptions, EditEventOptions, ListEventsOptions, AvailableCalendar } from './calendar/types';

// Poll (Surveys)
export { PollManager } from './poll/poll';
export {
  Poll, PollListItem, PollQuestion, PollAnswer, PollUser,
  PollPrivacyType, PollConstraint, PollInviteTarget,
  CreatePollOptions, EditPollOptions,
  CreateQuestionOptions, EditQuestionOptions,
  CreateAnswerOptions, EditAnswerOptions,
} from './poll/types';

// Security
export { SecurityManager, PrivateKeyResponse, EncryptionKeyData, SigningKeyResponse } from './security/security';

// Encryption
export { CryptoManager } from './encryption/crypto';
export {
  SigningKeyData,
  EncryptedSigningKey,
  MasterEncryptionKeyResponse,
  VerifiedKeysResponse,
  RsaPrivateKeyJwk,
  KeyTransferOptions,
  KeyTransferResult,
} from './encryption/types';

// Realtime
export { RealtimeManager } from './realtime/realtime';
export { RealtimeEvents, MessageSyncPayload, RealtimeManagerOptions } from './realtime/types';
