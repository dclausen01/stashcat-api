# CLAUDE.md

## Project Overview

`stashcat-api` is a TypeScript API client library for Stashcat messenger (schul.cloud variant). It covers authentication, channels, conversations, messages, file management, user/company data, account settings, notifications, and E2E encryption — designed as the foundation for a Nextcloud integration.

- **Runtime**: Node.js (CommonJS)
- **Language**: TypeScript 5.4.5, strict mode
- **HTTP**: Axios with form-urlencoded POST requests
- **Encryption**: Node.js built-in `crypto` (AES-256-CBC + RSA-2048)

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

| Manager | File | Responsibility |
|---|---|---|
| `StashcatClient` | `src/client/StashcatClient.ts` | Public facade, auth guard, composes all managers |
| `StashcatAPI` | `src/api/request.ts` | HTTP layer: Axios, device_id, client_key injection, status validation |
| `AuthManager` | `src/auth/login.ts` | Login/logout, AuthState |
| `ChannelManager` | `src/chats/channels.ts` | Full channel lifecycle (CRUD, members, moderation, invites) |
| `ConversationManager` | `src/chats/conversations.ts` | Conversations (list, create, archive, favorites) |
| `MessageManager` | `src/chats/messages.ts` | Messages (read, send, delete, like, flag) + file download |
| `UserManager` | `src/users/users.ts` | Own profile, user info by ID, company members |
| `AccountManager` | `src/account/account.ts` | Status, password, settings, devices, profile image, notifications |
| `FileManager` | `src/files/files.ts` | File info, folder listing, chunked upload, delete, rename, move, copy |
| `SecurityManager` | `src/security/security.ts` | Private key retrieval, file access keys |
| `CryptoManager` | `src/encryption/crypto.ts` | Static: AES-256-CBC, RSA-2048, encoding utilities |

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
| Endpoint | Manager |
|---|---|
| `/auth/login` | AuthManager |

### Channels
| Endpoint | Method |
|---|---|
| `/channels/subscripted` | `getChannels()` |
| `/channels/visible` | `getVisibleChannels()` |
| `/channels/info` | `getChannelInfo()` |
| `/channels/create` | `createChannel()` |
| `/channels/edit` | `editChannel()` |
| `/channels/delete` | `deleteChannel()` |
| `/channels/join` | `joinChannel()` |
| `/channels/quit` | `quitChannel()` |
| `/channels/createInvite` | `inviteUsersToChannel()` |
| `/channels/acceptInvite` | `acceptChannelInvite()` |
| `/channels/declineInvite` | `declineChannelInvite()` |
| `/channels/members` | `getChannelMembers()` |
| `/channels/removeUser` | `removeUserFromChannel()` |
| `/channels/addModeratorStatus` | `addChannelModerator()` |
| `/channels/removeModeratorStatus` | `removeChannelModerator()` |

### Conversations
| Endpoint | Method |
|---|---|
| `/message/conversations` | `getConversations()` |
| `/message/conversation` | `getConversation()` |
| `/message/createEncryptedConversation` | `createEncryptedConversation()` |
| `/message/archiveConversation` | `archiveConversation()` |
| `/message/set_favorite` | `setConversationFavorite()` |

### Messages
| Endpoint | Method |
|---|---|
| `/message/content` | `getMessages()` |
| `/message/send` | `sendMessage()` |
| `/message/delete` | `deleteMessage()` |
| `/message/like` | `likeMessage()` |
| `/message/unlike` | `unlikeMessage()` |
| `/message/flag` | `flagMessage()` |
| `/message/unflag` | `unflagMessage()` |
| `/message/list_flagged_messages` | `getFlaggedMessages()` |

### Files
| Endpoint | Method |
|---|---|
| `/file/download` | `downloadFile()` |
| `/file/upload` | `uploadFile()` (chunked) |
| `/file/info` | `getFileInfo()` |
| `/file/infos` | `FileManager.getFileInfos()` |
| `/file/delete` | `deleteFiles()` |
| `/file/rename` | `renameFile()` |
| `/file/move` | `moveFile()` |
| `/file/copy` | `FileManager.copyFile()` |
| `/file/quota` | `getStorageQuota()` |
| `/folder/get` | `listFolder()` |

### Users & Company
| Endpoint | Method |
|---|---|
| `/users/me` | `getMe()` |
| `/users/info` | `getUserInfo()` |
| `/company/member` | `getCompanyMembers()` |

### Account
| Endpoint | Method |
|---|---|
| `/account/change_status` | `changeStatus()` |
| `/account/change_password` | `changePassword()` |
| `/account/settings` | `getAccountSettings()` |
| `/account/list_active_devices` | `listActiveDevices()` |
| `/account/deactivate_device` | `deactivateDevice()` |
| `/account/store_profile_image` | `storeProfileImage()` |
| `/notifications/get` | `getNotifications()` |
| `/notifications/count` | `getNotificationCount()` |

### Security
| Endpoint | Method |
|---|---|
| `/security/get_private_key` | `getPrivateKey()` |
| `/security/set_file_access_key` | `SecurityManager.setFileAccessKey()` |

### Notifications (shared)
| Endpoint | Method |
|---|---|
| `/push/enable_notifications` | `ChannelManager / ConversationManager` |
| `/push/disable_notifications` | `ChannelManager / ConversationManager` |

## Key Files

```
src/
├── index.ts                    # Public export barrel — add exports here for new public APIs
├── api/
│   ├── request.ts             # StashcatAPI — HTTP layer only, no business logic
│   └── response.ts            # APIResponse, APIStatus interfaces
├── auth/
│   ├── login.ts               # AuthManager
│   └── types.ts               # LoginRequest, LoginResponse, AuthState, AuthConfig
├── chats/
│   ├── channels.ts            # ChannelManager (full CRUD + moderation)
│   ├── conversations.ts       # ConversationManager
│   ├── messages.ts            # MessageManager + file download
│   └── types.ts               # Channel, Conversation, Message, File, PaginationOptions
├── client/
│   └── StashcatClient.ts      # Main facade — primary entry point for consumers
├── users/
│   ├── users.ts               # UserManager
│   └── types.ts               # User, CompanyMember
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
  const payload = await this.api.post<ResponseType>('/endpoint', data);
  return payload.items || [];
} catch (error) {
  throw new Error(`Failed to X: ${error instanceof Error ? error.message : error}`);
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
import { ChannelManager } from '../../src/chats/channels';

describe('ChannelManager', () => {
  it('should return channels for a company', async () => {
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

## Encryption Notes

- AES session key auto-generated on `client.login()` via `CryptoManager.generateKey()`
- Messages are decrypted transparently in `MessageManager.getMessages()` when `encrypted: true`
- Key is cleared on `client.logout()`
- `CryptoManager` is fully static — never instantiate it
- File upload encryption: provide `encrypted: true` and `iv` (hex) in `FileUploadOptions`
- `SecurityManager.getPrivateKey()` retrieves the server-stored RSA private key for E2E flows

## Known Gaps (not yet implemented)

- Calendar module (`/calendar/*`)
- Surveys/polls (`/survey/*`)
- Admin/management functions (`/manage/*`)
- Voice/video calls (proprietary, likely not REST-based)
