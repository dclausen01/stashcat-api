# Stashcat API Client

A TypeScript API client for Stashcat messenger (schul.cloud version).

## Features

- ✅ Authentication (Email/Password)
- ✅ Channel management
- ✅ Conversation management  
- ✅ Message operations (read/send)
- ✅ File download
- ✅ AES-256-CBC encryption
- ✅ RSA key generation
- ✅ TypeScript support
- ✅ Node.js compatible

## Installation

```bash
npm install stashcat-api
```

## Quick Start

```typescript
import { StashcatClient } from 'stashcat-api';
import * as dotenv from 'dotenv';

dotenv.config();

async function main() {
  // Initialize client
  const client = new StashcatClient({
    baseUrl: process.env.STASHCAT_BASE_URL,
  });

  // Authenticate
  await client.login({
    email: process.env.STASHCAT_EMAIL!,
    password: process.env.STASHCAT_PASSWORD!,
    appName: 'my-app',
  });

  // Get channels
  const channels = await client.getChannels('company-id');
  console.log('Channels:', channels);

  // Get conversations
  const conversations = await client.getConversations();
  console.log('Conversations:', conversations);

  // Get messages from a channel
  const messages = await client.getMessages('channel-id', 'channel');
  console.log('Messages:', messages);
}

main().catch(console.error);
```

## Configuration

Create a `.env` file:

```env
STASHCAT_BASE_URL=https://api.stashcat.com/
# STASHCAT_BASE_URL=https://api.schul.cloud/  # For schul.cloud variant

STASHCAT_EMAIL=your-email@example.com
STASHCAT_PASSWORD=your-password
STASHCAT_APP_NAME=stashcat-api-client
```

## API Reference

### StashcatClient

Main client class for interacting with the Stashcat API.

#### Authentication

```typescript
// Login
await client.login({
  email: 'user@example.com',
  password: 'password',
  appName: 'my-app',
  encrypted: false,
  callable: false,
  keyTransferSupport: false,
});

// Check authentication status
const isAuthenticated = client.isAuthenticated();

// Logout
client.logout();
```

#### Channels

```typescript
// Get all channels for a company
const channels = await client.getChannels('company-id');

interface Channel {
  id: string;
  name: string;
  description?: string;
  company_id: string;
  members: ChannelMember[];
}
```

#### Conversations

```typescript
// Get conversations
const conversations = await client.getConversations({
  limit: 50,
  offset: 0,
  archive: 0,
  sorting: ['created_at'],
});

interface Conversation {
  id: string;
  type: 'direct' | 'group';
  name?: string;
  participants: ConversationParticipant[];
  last_message?: Message;
}
```

#### Messages

```typescript
// Get messages from a channel
const messages = await client.getMessages('channel-id', 'channel', {
  limit: 50,
  offset: 0,
});

// Get messages from a conversation
const messages = await client.getMessages('conversation-id', 'conversation', {
  limit: 50,
  offset: 0,
});

interface Message {
  id: string;
  text: string;
  sender: MessageSender | string;
  conversation_id?: string;
  channel_id?: string;
  encrypted?: boolean;
  iv?: string;
}
```

#### Files

```typescript
// Download a file
const fileBuffer = await client.downloadFile(file, encryptionKey);
```

## Encryption

The client automatically handles message encryption/decryption using AES-256-CBC:

```typescript
// Get encryption key
const encryptionKey = client.getEncryptionKey();

// Messages are automatically decrypted when retrieved
const messages = await client.getMessages('channel-id', 'channel');
```

## Development

### Build

```bash
npm run build
```

### Test

```bash
npm test
```

### Development Watch

```bash
npm run dev
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## License

MIT
