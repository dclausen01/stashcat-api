# Stashcat API Client

A TypeScript API client library for [Stashcat](https://www.stashcat.com/) messenger (schul.cloud compatible). Covers authentication, channels, conversations, messages, files, users, companies, account settings, notifications, real-time events, and full E2E encryption.

## Features

- Authentication (email/password) with session persistence
- Channel management (CRUD, members, moderation, invites)
- Conversations (list, create, archive, favorites)
- Messages (read, send, delete, like, flag)
- File management (upload, download, rename, move, delete, folders)
- E2E encryption (RSA-4096 OAEP + AES-256-CBC) with automatic decryption
- Company discovery and member listing
- Real-time events via Socket.io (push.stashcat.com)
- Account settings, devices, notifications
- Session serialization for server-side use (e.g. Nextcloud plugins)

## Installation

```bash
npm install stashcat-api
```

## Quick Start

```typescript
import { StashcatClient } from 'stashcat-api';

const client = new StashcatClient({
  baseUrl: 'https://api.stashcat.com/',
});

// Login with E2E decryption
await client.login({
  email: 'user@example.com',
  password: 'password',
  securityPassword: 'password', // often same as login password
});

// Encrypted messages are automatically decrypted
const companies = await client.getCompanies();
const channels = await client.getChannels(companies[0].id);
const messages = await client.getMessages(channels[0].id, 'channel');
console.log(messages[0].text); // plaintext

// Conversations work the same way
const conversations = await client.getConversations();
const convMessages = await client.getMessages(conversations[0].id, 'conversation');

// Real-time events
const rt = await client.createRealtimeManager();
await rt.connect();
rt.on('message_sync', (data) => console.log('New message:', data));

client.logout();
```

## Configuration

Create a `.env` file:

```env
STASHCAT_BASE_URL=https://api.stashcat.com/
STASHCAT_EMAIL=your-email@example.com
STASHCAT_PASSWORD=your-password
STASHCAT_APP_NAME=stashcat-api-client
STASHCAT_DEVICE_ID=                           # Optional; auto-generated if omitted
STASHCAT_SECURITY_PASSWORD=                   # Optional; defaults to STASHCAT_PASSWORD
```

## E2E Encryption

Stashcat uses RSA-4096 + AES-256-CBC for end-to-end encryption:

1. Each user has an RSA-4096 keypair (private key stored encrypted on the server)
2. Each encrypted channel/conversation has a per-chat AES-256 key (RSA-OAEP encrypted with the user's public key)
3. Messages are AES-256-CBC encrypted with the chat's AES key

```typescript
// Option A: Unlock during login
await client.login({
  email, password,
  securityPassword: password,
});

// Option B: Unlock separately
await client.unlockE2E(securityPassword);
console.log(client.isE2EUnlocked()); // true

// Messages from both channels and conversations are auto-decrypted
const messages = await client.getMessages(id, 'channel');
```

## Session Persistence

For server-side use (e.g. Nextcloud plugins) where each request creates a new process:

```typescript
// After login: serialize
const session = client.serialize();
await db.set('session', JSON.stringify(session));

// Later: restore without re-login
const session = JSON.parse(await db.get('session'));
const client = StashcatClient.fromSession(session, { baseUrl });
await client.unlockE2E(securityPassword); // E2E state is NOT persisted
```

## API Reference

### Authentication

```typescript
await client.login({ email, password, securityPassword });
client.isAuthenticated();
client.isE2EUnlocked();
client.logout();
```

### Channels

```typescript
await client.getChannels(companyId);
await client.getVisibleChannels(companyId, { search: 'test' });
await client.getChannelInfo(channelId);
await client.createChannel({ channel_name, company, type: 'closed' });
await client.joinChannel(channelId);
await client.quitChannel(channelId);
await client.getChannelMembers(channelId);
```

### Conversations

```typescript
await client.getConversations({ limit: 50 });
await client.getConversation(conversationId);
await client.createEncryptedConversation(memberIds, uniqueIdentifier);
await client.archiveConversation(conversationId);
await client.setConversationFavorite(conversationId, true);
```

### Messages

```typescript
await client.getMessages(id, 'channel', { limit: 50 });
await client.sendMessage({ target: id, target_type: 'channel', text: 'Hello' });
await client.deleteMessage(messageId);
await client.markAsRead(id, 'channel', messageId);
await client.likeMessage(messageId);
await client.flagMessage(messageId);
await client.getFlaggedMessages('channel', channelId);
```

### Files

```typescript
await client.downloadFile(file, aesKey);
await client.uploadFile(filePath, { target: 'channel', targetId, encrypted: true });
await client.listFolder({ type: 'channel', type_id: channelId });
await client.listPersonalFiles();
await client.getFileInfo(fileId);
await client.renameFile(fileId, 'new-name.txt');
await client.moveFile(fileId, parentFolderId);
await client.deleteFiles([fileId]);
await client.getStorageQuota('channel', channelId);
```

### Users & Companies

```typescript
await client.getMe();
await client.getUserInfo(userId);
await client.getCompanies();
await client.getCompanyDetails(companyId);
await client.getCompanyMembers(companyId);
```

### Real-time Events

```typescript
const rt = await client.createRealtimeManager({ debug: true });
await rt.connect();
rt.on('message_sync', (data) => { /* new/updated message */ });
rt.on('user-started-typing', (chatType, chatId, userId) => { /* typing */ });
rt.sendTyping('channel', channelId);
rt.disconnect();
```

### Account

```typescript
await client.changeStatus('Available');
await client.getAccountSettings();
await client.listActiveDevices();
await client.getNotifications();
await client.getNotificationCount();
```

## Development

```bash
npm install        # Install dependencies
npm run build      # Compile TypeScript -> dist/
npm run dev        # Watch mode
npm test           # Run Jest tests
npm run clean      # Remove dist/
```

## License

MIT
