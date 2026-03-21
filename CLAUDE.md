# CLAUDE.md

## Project Overview

`stashcat-api` is a TypeScript API client library for Stashcat messenger (schul.cloud variant). It covers authentication, channels, conversations, messages, file management, user/company data, account settings, notifications, and E2E encryption — designed as the foundation for a Nextcloud integration.

- **Runtime**: Node.js (CommonJS)
- **Language**: TypeScript 5.4.5, strict mode
- **HTTP**: Axios with form-urlencoded POST requests
- **Encryption**: Node.js built-in `crypto` (AES-256-CBC + RSA-4096 OAEP)

## Development Commands

```bash
npm install        # Install dependencies (required before first build)
npm run build      # Compile TypeScript → dist/
npm run dev        # Watch mode compilation
npm test           # Run Jest tests
npm run test:watch # Jest watch mode
npm run clean      # Remove dist/
```

Build output goes to `dist/`. Main entry: `dist/index.js`, types: `dist/index.d.ts`.

## Architecture

The library uses a **Manager + Facade** pattern. `StashcatClient` is the single public entry point; it delegates to specialized Manager classes.

### Component Map

| Manager               | File                           | Responsibility                                                        |
| --------------------- | ------------------------------ | --------------------------------------------------------------------- |
| `StashcatClient`      | `src/client/StashcatClient.ts` | Public facade, auth guard, composes all managers                      |
| `StashcatAPI`         | `src/api/request.ts`           | HTTP layer: Axios, device_id, client_key injection, status validation |
| `AuthManager`         | `src/auth/login.ts`            | Login/logout, AuthState                                               |
| `ChannelManager`      | `src/chats/channels.ts`        | Full channel lifecycle (CRUD, members, moderation, invites)           |
| `ConversationManager` | `src/chats/conversations.ts`   | Conversations (list, create, archive, favorites)                      |
| `MessageManager`      | `src/chats/messages.ts`        | Messages (read, send, delete, like, flag) + file download             |
| `UserManager`         | `src/users/users.ts`           | Own profile, user info by ID, company members, company discovery      |
| `RealtimeManager`     | `src/realtime/realtime.ts`     | Socket.io v4 push events from push.stashcat.com                      |
| `AccountManager`      | `src/account/account.ts`       | Status, password, settings, devices, profile image, notifications     |
| `FileManager`         | `src/files/files.ts`           | File info, folder listing, chunked upload, delete, rename, move, copy |
| `SecurityManager`     | `src/security/security.ts`     | RSA private key unlock, conversation AES key decryption, cache       |
| `CryptoManager`       | `src/encryption/crypto.ts`     | Static: AES-256-CBC, RSA-2048, encoding utilities                     |

### Request Flow

1. `StashcatClient` calls `requireAuth()` → throws if not authenticated
2. Delegates to the appropriate Manager
3. Manager calls `api.createAuthenticatedRequestData({...})` to inject `client_key` + `device_id`
4. `StashcatAPI.post<T>()` sends a form-urlencoded POST, validates `status.value === 'OK'`
5. Returns typed payload `T`

### Auth Flow

1. `client.login()` → `AuthManager.login()` → POST `/auth/login`
2. `client_key` stored and injected into all subsequent requests via `api.setClientKey()`
3. AES session key auto-generated via `CryptoManager.generateKey()` and stored on the client
4. `client.logout()` clears both the session key and auth state

## API Endpoints

All requests use `POST` with `Content-Type: application/x-www-form-urlencoded`.

### Auth

| Endpoint      | Manager     |
| ------------- | ----------- |
| `/auth/login` | AuthManager |

### Channels

| Endpoint                          | Method                     |
| --------------------------------- | -------------------------- |
| `/channels/subscripted`           | `getChannels()`            |
| `/channels/visible`               | `getVisibleChannels()`     |
| `/channels/info`                  | `getChannelInfo()`         |
| `/channels/create`                | `createChannel()`          |
| `/channels/edit`                  | `editChannel()`            |
| `/channels/delete`                | `deleteChannel()`          |
| `/channels/join`                  | `joinChannel()`            |
| `/channels/quit`                  | `quitChannel()`            |
| `/channels/createInvite`          | `inviteUsersToChannel()`   |
| `/channels/acceptInvite`          | `acceptChannelInvite()`    |
| `/channels/declineInvite`         | `declineChannelInvite()`   |
| `/channels/members`               | `getChannelMembers()`      |
| `/channels/removeUser`            | `removeUserFromChannel()`  |
| `/channels/addModeratorStatus`    | `addChannelModerator()`    |
| `/channels/removeModeratorStatus` | `removeChannelModerator()` |

### Conversations

| Endpoint                               | Method                          |
| -------------------------------------- | ------------------------------- |
| `/message/conversations`               | `getConversations()`            |
| `/message/conversation`                | `getConversation()`             |
| `/message/createEncryptedConversation` | `createEncryptedConversation()` |
| `/message/archiveConversation`         | `archiveConversation()`         |
| `/message/set_favorite`                | `setConversationFavorite()`     |

### Messages

| Endpoint                         | Method                 |
| -------------------------------- | ---------------------- |
| `/message/content`               | `getMessages()`        |
| `/message/send`                  | `sendMessage()`        |
| `/message/delete`                | `deleteMessage()`      |
| `/message/mark_read`             | `markAsRead()`         |
| `/message/like`                  | `likeMessage()`        |
| `/message/unlike`                | `unlikeMessage()`      |
| `/message/flag`                  | `flagMessage()`        |
| `/message/unflag`                | `unflagMessage()`      |
| `/message/list_flagged_messages` | `getFlaggedMessages()` |

### Files

| Endpoint         | Method                       |
| ---------------- | ---------------------------- |
| `/file/download` | `downloadFile()`             |
| `/file/upload`   | `uploadFile()` (chunked)     |
| `/file/info`     | `getFileInfo()`              |
| `/file/infos`    | `FileManager.getFileInfos()` |
| `/file/delete`   | `deleteFiles()`              |
| `/file/rename`   | `renameFile()`               |
| `/file/move`     | `moveFile()`                 |
| `/file/copy`     | `FileManager.copyFile()`     |
| `/file/quota`    | `getStorageQuota()`          |
| `/folder/get`    | `listFolder()`               |

### Users & Company

| Endpoint           | Method                                                          |
| ------------------ | --------------------------------------------------------------- |
| `/users/me`        | `getMe()`                                                       |
| `/users/info`      | `getUserInfo()`                                                  |
| `/company/member`  | `getCompanies()` (without company_id) / `getCompanyMembers()`   |
| `/company/details` | `getCompanyDetails()`                                            |

### Account

| Endpoint                       | Method                   |
| ------------------------------ | ------------------------ |
| `/account/change_status`       | `changeStatus()`         |
| `/account/change_password`     | `changePassword()`       |
| `/account/settings`            | `getAccountSettings()`   |
| `/account/list_active_devices` | `listActiveDevices()`    |
| `/account/deactivate_device`   | `deactivateDevice()`     |
| `/account/store_profile_image` | `storeProfileImage()`    |
| `/notifications/get`           | `getNotifications()`     |
| `/notifications/count`         | `getNotificationCount()` |

### Security

| Endpoint                        | Method                               |
| ------------------------------- | ------------------------------------ |
| `/security/get_private_key`     | `getPrivateKey()`                    |
| `/security/set_file_access_key` | `SecurityManager.setFileAccessKey()` |

### Notifications (shared)

| Endpoint                      | Method                                 |
| ----------------------------- | -------------------------------------- |
| `/push/enable_notifications`  | `ChannelManager / ConversationManager` |
| `/push/disable_notifications` | `ChannelManager / ConversationManager` |

### Realtime (Socket.io)

Push events are delivered via Socket.io v4 at `push.stashcat.com` — see [Realtime / Socket.io](#realtime--socketio) below.

## Key Files

```
src/
├── index.ts                    # Public export barrel — add exports here for new public APIs
├── api/
│   ├── request.ts             # StashcatAPI — HTTP layer only, no business logic
│   └── response.ts            # APIResponse, APIStatus interfaces
├── auth/
│   ├── login.ts               # AuthManager (incl. restoreSession() for session persistence)
│   └── types.ts               # LoginRequest, LoginResponse, AuthState, AuthConfig
├── chats/
│   ├── channels.ts            # ChannelManager (full CRUD + moderation)
│   ├── conversations.ts       # ConversationManager
│   ├── messages.ts            # MessageManager + file download + markAsRead
│   └── types.ts               # Channel, Conversation, Message, MessageFile, PaginationOptions
├── client/
│   └── StashcatClient.ts      # Main facade — primary entry point for consumers
                                # Incl. serialize() / fromSession() for Nextcloud session persistence
├── realtime/
│   ├── realtime.ts            # RealtimeManager — Socket.io v4 push events
│   └── types.ts               # RealtimeEvents, MessageSyncPayload, RealtimeManagerOptions
├── users/
│   ├── users.ts               # UserManager + company discovery (getCompanies, getCompanyDetails)
│   └── types.ts               # User, Company, CompanyMember
├── account/
│   ├── account.ts             # AccountManager
│   └── types.ts               # AccountSettings, ActiveDevice, Notification
├── files/
│   ├── files.ts               # FileManager (including chunked upload)
│   └── types.ts               # FileInfo, FolderItem, FolderListOptions, FileUploadOptions
├── security/
│   └── security.ts            # SecurityManager
└── encryption/
    └── crypto.ts              # CryptoManager — all static, no instantiation needed
examples/                      # Usage examples (JS/TS), not part of the published package
dist/                          # Build output (git-ignored)
```

## Code Conventions

### Naming

- **Classes / Interfaces / Types**: PascalCase (`StashcatClient`, `AuthConfig`)
- **Methods / Properties / Variables**: camelCase (`getChannels`, `clientKey`)
- **API request/response fields**: snake_case (`device_id`, `client_key`, `company_id`)
- **Constants**: UPPERCASE_SNAKE_CASE (`ALGORITHM`)
- **Manager classes**: suffix with `Manager` (`ChannelManager`)

### TypeScript

- Strict mode is enabled — no implicit `any`, no unchecked indexing
- Avoid `any` in public API signatures; prefer typed interfaces or `unknown`
- All API response shapes must have typed interfaces (local to the manager file if not exported)
- Use optional chaining (`?.`) for nullable values
- Use `private` keyword for internal class members

### Error Handling

```typescript
try {
  const data = this.api.createAuthenticatedRequestData({ param });
  const payload = await this.api.post<ResponseType>("/endpoint", data);
  return payload.items || [];
} catch (error) {
  throw new Error(
    `Failed to X: ${error instanceof Error ? error.message : error}`,
  );
}
```

- `StashcatAPI.post()` already validates `status.value === 'OK'` and handles Axios errors
- Managers rethrow with a descriptive prefix: `"Failed to X: ..."`

### Authentication Guard

All `StashcatClient` public methods call `this.requireAuth()` before delegating:

```typescript
private requireAuth(): void {
  if (!this.isAuthenticated()) {
    throw new Error('Not authenticated. Please login first.');
  }
}
```

Do **not** add auth checks inside individual Managers — they assume the API already has `clientKey` set.

## Adding a New API Resource

1. **Create `src/<resource>/types.ts`** — Define request/response interfaces
2. **Create `src/<resource>/<resource>.ts`** — Implement a `*Manager` class using `constructor(private api: StashcatAPI) {}`
3. **Add to `StashcatClient`** (`src/client/StashcatClient.ts`):
   - Import and instantiate in constructor
   - Add public facade methods that call `this.requireAuth()` then delegate
4. **Export from `src/index.ts`**

## Testing

- **Framework**: Jest with ts-jest preset
- **Test location**: `test/` directory (pattern: `**/test/**/*.test.ts`)
- No tests exist yet — new features should include accompanying tests
- Run with `npm test`, TDD mode with `npm run test:watch`

Example test structure:

```typescript
// test/chats/channels.test.ts
import { ChannelManager } from "../../src/chats/channels";

describe("ChannelManager", () => {
  it("should return channels for a company", async () => {
    // mock StashcatAPI, call getChannels(), assert result
  });
});
```

## Environment Variables

Copy `.env.example` to `.env`:

```env
STASHCAT_BASE_URL=https://api.stashcat.com/   # or https://api.schul.cloud/
STASHCAT_EMAIL=your-email@example.com
STASHCAT_PASSWORD=your-password
STASHCAT_APP_NAME=stashcat-api-client
STASHCAT_DEVICE_ID=                           # Optional; auto-generated if omitted
```

## E2E Encryption (live-verified 2026-03-21)

### Key Structure

Stashcat uses RSA-4096 + AES-256-CBC:

1. Each user has an RSA-4096 keypair. The **encrypted** private key is stored server-side.
2. Each encrypted conversation has a **per-conversation AES-256 key** — RSA-OAEP encrypted
   with the user's public key, stored in `conversation.key` (base64).
3. Each message is AES-256-CBC encrypted: `text` (hex ciphertext), `iv` (hex IV).

### `/security/get_private_key` Response

```typescript
// Actual API shape (was previously wrong in the codebase):
{
  payload: {
    keys: {
      user_id: string;
      type: "encryption";
      format: "pem";
      // JSON-encoded string: { "private": "-----BEGIN ENCRYPTED PRIVATE KEY-----..." }
      private_key: string;
      public_key?: string;
      // ...
    }
  }
}
```

The private key PEM is a **PKCS#8 PBES2** encrypted key — Node.js decrypts it natively:
```typescript
crypto.createPrivateKey({ key: pem, format: 'pem', passphrase: Buffer.from(securityPassword, 'utf8') })
```

### Conversation Key

`conversation.key` (base64, 512 bytes = RSA-4096 output):
```typescript
crypto.privateDecrypt({ key: rsaPrivateKey, padding: crypto.constants.RSA_PKCS1_OAEP_PADDING }, encryptedKeyBuffer)
// → 32-byte AES key Buffer
```

### Full Decryption Flow

```typescript
// 1. Login + auto-unlock E2E (security password often == login password)
await client.login({
  email, password,
  securityPassword: password,  // or set separately
});

// 2. Messages decrypted automatically
const messages = await client.getMessages(conversationId, 'conversation');
// → messages[].text is plaintext

// 3. Manual unlock (if not passed to login)
await client.unlockE2E(securityPassword);
console.log(client.isE2EUnlocked()); // true

// 4. Get AES key for a conversation
const aesKey = await client.getConversationAesKey(conversationId); // Buffer (32 bytes)
```

### SecurityManager API

- `unlockPrivateKey(securityPassword)` — fetches RSA key from server, decrypts with passphrase
- `isUnlocked()` — returns true if RSA key is available
- `decryptConversationKey(base64key, cacheId?)` — RSA-OAEP → 32-byte AES key (cached)
- `clearKeyCache()` — clears RSA key + AES key cache (called on logout)

### Notes

- Security password is **often identical** to the login password (Stashcat default)
- AES key cache: `Map<conversationId, Buffer>` — RSA decryption happens once per conversation
- Session serialization does **not** persist the RSA private key (security) — call `unlockE2E()` again after `fromSession()`
- `CryptoManager` is fully static — never instantiate it
- File upload encryption: provide `encrypted: true` and `iv` (hex) in `FileUploadOptions`

## Session Persistence (for Nextcloud plugin)

`StashcatClient` supports serializing and restoring an authenticated session without re-login.
This is essential for Nextcloud plugins where each HTTP request creates a new PHP/Node process.

```typescript
// After login: serialize and store in Nextcloud DB
const session = client.serialize(); // { deviceId, clientKey, baseUrl? }
await db.set("stashcat_session_" + userId, JSON.stringify(session));

// On next request: restore without re-login
const session = JSON.parse(await db.get("stashcat_session_" + userId));
const client = StashcatClient.fromSession(session, {
  baseUrl: process.env.STASHCAT_BASE_URL,
});
await client.getConversations(); // works immediately
```

`SerializedSession` interface (exported from `src/index.ts`):

```typescript
interface SerializedSession {
  deviceId: string;
  clientKey: string;
  baseUrl?: string; // optional, can be set during fromSession()
}
```

Internally, `AuthManager.restoreSession(clientKey)` sets the auth state and injects the
`client_key` into `StashcatAPI` without a network call.

**E2E after restore**: E2E unlock state is NOT serialized. Call `unlockE2E()` again:
```typescript
const client = StashcatClient.fromSession(session, { baseUrl });
await client.unlockE2E(securityPassword);  // required for E2E decryption
```

## Realtime / Socket.io

### Overview

`RealtimeManager` connects to `push.stashcat.com` via Socket.io v4 for real-time push events
(new messages, typing indicators, online status, channel changes, etc.).

- **Dependency**: `socket.io-client` v4
- **Transport**: WebSocket (primary) + HTTP long-polling (fallback)
- **Server**: `https://push.stashcat.com`

### Auth Flow (reverse-engineered from schul.cloud Angular bundle)

The auth flow was discovered by reverse-engineering the production Angular bundle (`chunk-6A7IIHB3.js`).
This is critical — no credentials are passed in the connection options.

1. Connect to `push.stashcat.com` with **no auth in query/headers**
2. After `'connect'` event: emit `'userid'` with `{ hidden_id, device_id, client_key }`
   - `hidden_id` = `socket_id` field from `/users/me` API response
   - `device_id` = the device ID used for REST API calls
   - `client_key` = the session key from login
3. Server responds with `'new_device_connected'` event → events start flowing
4. On reconnect: re-emit `'userid'` with the same credentials

```typescript
// Usage
const rt = await client.createRealtimeManager({ debug: true });
await rt.connect();
rt.on('message_sync', (data) => console.log('New message:', data));
rt.on('user-started-typing', (chatType, chatId, userId) => { /* ... */ });
rt.sendTyping('channel', channelId);  // emit typing indicator
rt.disconnect();
```

`createRealtimeManager()` is **async** — it calls `getMe()` internally to fetch `socket_id`.

### Live-verified Events

These events have been confirmed via live testing against schul.cloud (2026-03-21):

| Event                    | Payload                                                                   | Notes                                  |
| ------------------------ | ------------------------------------------------------------------------- | -------------------------------------- |
| `new_device_connected`   | `{ device_id: string, ip_address: string }`                              | Auth confirmation                      |
| `message_sync`           | `MessageSyncPayload` (30+ fields, identical to REST `/message/content`)  | New/updated messages                   |
| `user-started-typing`    | `(chatType: string, chatId: number, userId: number)`                     | Typing indicator                       |
| `device_disconnected`    | `{ device_id: string }`                                                  | Another connection for this device     |
| `online_status_change`   | `unknown`                                                                | User went online/offline               |
| `channel_modified`       | `unknown`                                                                | Channel metadata changed               |
| `channel_created`        | `unknown`                                                                | New channel                            |
| `channel_deleted`        | `unknown`                                                                | Channel removed                        |
| `message_read`           | `unknown`                                                                | Message marked as read                 |
| `notification`           | `unknown`                                                                | Push notification                      |

Additional events discovered from the Angular bundle (not yet live-verified):
`channel_membership_gained`, `channel_membership_lost`, `object_change`, `file_change`,
`new_invite`, `new_login`, `call_created`, `call_changed`,
`key_sync_request`, `key_sync_payload`, `key_sync_abort`,
`send_encrypted_data_to_device`, `encrypted_data_from_device`,
`device_to_device_message`, `one_time_key_claimed`, `new_mx_device`, `removed_mx_device`.

### Typing Indicator

Emit: `socket.emit('started-typing', chatType, chatId)`
Receive: `'user-started-typing'` event with `(chatType, chatId, userId)`

Note the asymmetry: emit uses `'started-typing'`, receive uses `'user-started-typing'`.

### MessageSyncPayload

The `message_sync` payload is a full message object (see `src/realtime/types.ts`). Key fields:

- `id`, `text`, `sender`, `time`, `micro_time`
- `conversation_id` (0 if channel message) / `channel_id` (0 if conversation message)
- `encrypted`, `iv` — for E2E decryption
- `files`, `likes`, `liked`, `flagged`, `is_forwarded`, `reactions`
- `reciever` (note: API has a typo, not `receiver`)

## Company Discovery

### Endpoints (live-verified)

| Endpoint           | Parameters     | Returns                        | Notes                                            |
| ------------------ | -------------- | ------------------------------ | ------------------------------------------------ |
| `/company/member`  | *(none)*       | `{ companies: Company[] }`     | All companies the user belongs to                |
| `/company/details` | `company_id`   | `{ company: Company }`         | Detailed info for a single company               |

**Important:** `/company/get` and `/company/info` do **NOT** exist (return 404). Only the endpoints above work.

`/company/member` has dual behavior:
- **Without** `company_id` → returns `payload.companies[]` (company discovery via `getCompanies()`)
- **With** `company_id` → returns `payload.members[]` (member listing via `getCompanyMembers()`)

### Company Interface

```typescript
interface Company {
  id: string;
  name: string;
  quota?: number;            // Storage quota in some unit
  quota_byte?: number;
  max_users?: number;
  users?: number;            // Can be { created: number, active: number } object in detail response
  features?: string[];       // e.g. ["managed-channels", "marketplace"]
  marketplace_modules?: string[];  // e.g. ["calendar", "survey", "voip", "sync", ...]
  domains?: string[];        // e.g. ["snrd.local", "bbz-rd-eck.de"]
  roles?: Array<{ id: string; name: string; editable?: boolean }>;
  permission?: string[];
  // ... see src/users/types.ts for full interface
}
```

## Live-verified API Behaviors

The following behaviors have been confirmed via live testing against schul.cloud:

### File Download

- **URL format**: `GET {baseUrl}/file/download?device_id={deviceId}&client_key={clientKey}&file_id={fileId}`
- **Response**: Raw binary data (not base64)
- **Decryption**: Binary → hex string → `CryptoManager.decrypt(hexString, key, iv)`
- **IV source**: `file.e2e_iv` field — must be present for encrypted files (throws if missing)

### Folder Listing

- **Endpoint**: POST `/folder/get`
- **Required params**: `type` (e.g. `'channel'`, `'conversation'`, `'user'`) + `type_id`
- **Personal files**: Use `type: 'user'` with `type_id` = user's own ID
- **Response**: `{ folders: FolderEntry[], files: FileEntry[] }`

### Conversations Sorting

- `sorting` parameter must be JSON-serialized: `JSON.stringify(options.sorting)`
- Passing a raw array causes the API to ignore the sorting

### Device ID Generation

- Uses `crypto.randomBytes(16).toString('hex')` (32 hex chars)
- Old implementation used `Math.random()` which was insecure and non-unique

## Extended Type Definitions

### Message (src/chats/types.ts)

Fields confirmed via live `message_sync` events and REST API:

- `files?: MessageFile[]` — attached files
- `reply_to_id?: string` — ID of the message being replied to
- `likes?: number` — number of likes
- `liked?: boolean` — whether the current user liked this message
- `flagged?: boolean` — whether the current user flagged this message
- `edited?: boolean` — whether the message has been edited
- `time?: number` — Unix timestamp (seconds)
- `micro_time?: number` — microsecond precision timestamp
- `kind?: string` — e.g. `'text'`
- `type?: string` — message type
- `seen_by_others?: boolean`, `unread?: boolean`
- `is_forwarded?: boolean`, `has_file_attached?: boolean`
- `alarm?: boolean`, `confirmation_required?: boolean`
- `thread_id?: string`, `is_deleted_by_manager?: boolean`
- `reactions?: unknown[]`, `channel?: unknown`, `broadcast?: unknown`

### MessageFile (src/chats/types.ts)

Live-verified fields — note the API uses `mime` not `mime_type`, and `size_string`/`size_byte` not `size`:

```typescript
interface MessageFile {
  id: string;
  name: string;
  size_string?: string;    // e.g. "63 kb"
  size_byte?: string;      // e.g. "63000"
  mime?: string;           // MIME type (API field is "mime", not "mime_type")
  ext?: string;            // file extension without dot
  encrypted?: boolean;
  e2e_iv?: string | null;  // AES IV for decryption
  folder_type?: string;    // e.g. "channel", "conversation"
  owner_id?: string;
  md5?: string;
}
```

### Channel (src/chats/types.ts)

Extended with +11 fields from live API responses:

- `type?: string` — channel type
- `visible?: boolean`, `writable?: boolean`, `encrypted?: boolean`, `inviteable?: boolean`
- `owner_id?: string`, `image?: string`
- `unread_count?: number`, `last_message?: Message`
- `favorite?: boolean`, `member_count?: number`

### User (src/users/types.ts)

Extended with +11 fields from live `/users/me` response:

- `socket_id?: string` — **critical**: used as `hidden_id` for Socket.io auth
- `online?: boolean`, `allows_voip_calls?: boolean`, `mx_user_id?: string`
- `language?: string`, `image?: string`
- `roles?: Array<{ id: string; name: string; company_id: string }>`
- `permissions?: string[]`, `is_bot?: boolean`
- `last_login?: string`, `totp_active?: boolean`

## Known API Limitations (confirmed)

- **No `editMessage()`** — Stashcat does not provide a message-edit endpoint. Messages can only be deleted.
- **No `deleteConversation()`** — Conversations can only be archived (`archiveConversation()`), not deleted.
- **No emoji reactions** — Stashcat does not support emoji reactions; only like/unlike is available.
- **No message search** — No `/message/search` endpoint known.
- **No `/company/get` or `/company/info`** — Only `/company/member` and `/company/details` work.
- **`reciever` typo** — The API spells it `reciever` (not `receiver`) in message payloads.

## Known Gaps (not yet implemented)

- Calendar module (`/calendar/*`)
- Surveys/polls (`/survey/*`)
- Admin/management functions (`/manage/*`)
- Voice/video calls (proprietary, likely not REST-based)
- Full E2E key exchange for multi-participant conversations (key distribution flow)
- Auto-reconnect on session expiry
- Multi-user session pool (needed for Nextcloud: one `StashcatClient` per Nextcloud user)
- Full typing of all Socket.io event payloads (many are still `unknown`)
