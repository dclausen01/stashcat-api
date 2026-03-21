export { StashcatClient, StashcatClientConfig, SerializedSession } from './client/StashcatClient';
export { StashcatAPI, StashcatConfig } from './api/request';
export { APIResponse, APIStatus } from './api/response';

// Auth
export { AuthManager, AuthConfig, AuthState } from './auth/login';

// Chats
export { ChannelManager, CreateChannelOptions, EditChannelOptions, ChannelMembersOptions } from './chats/channels';
export { ConversationManager } from './chats/conversations';
export { MessageManager, SendMessageOptions } from './chats/messages';
export { Channel, ChannelMember, Conversation, ConversationParticipant, Message, MessageFile, MessageSender, PaginationOptions } from './chats/types';

// Users
export { UserManager } from './users/users';
export { User, Company, CompanyMember } from './users/types';

// Account
export { AccountManager } from './account/account';
export { AccountSettings, ActiveDevice, Notification } from './account/types';

// Files
export { FileManager } from './files/files';
export { FileInfo, FolderItem, FolderContent, FolderEntry, FileEntry, FolderListOptions, FileUploadOptions, FileQuota, FileStorageType } from './files/types';

// Security
export { SecurityManager, PrivateKeyResponse, EncryptionKeyData } from './security/security';

// Encryption (EncryptionKey removed — no longer used internally)
export { CryptoManager } from './encryption/crypto';

// Realtime
export { RealtimeManager } from './realtime/realtime';
export { RealtimeEvents, MessageSyncPayload, RealtimeManagerOptions } from './realtime/types';
