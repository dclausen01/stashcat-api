# CLAUDE.md

## Project Overview

`stashcat-api` is a TypeScript API client library for Stashcat messenger (schul.cloud variant). It provides authentication, channel/conversation management, message operations, file downloads, and AES-256-CBC/RSA encryption.

- **Runtime**: Node.js (CommonJS)
- **Language**: TypeScript 5.4.5, strict mode
- **HTTP**: Axios with form-urlencoded POST requests
- **Encryption**: Node.js built-in `crypto` (AES-256-CBC + RSA-2048)

## Development Commands

```bash
npm run build      # Compile TypeScript → dist/
npm run dev        # Watch mode compilation
npm test           # Run Jest tests
npm run test:watch # Jest watch mode
npm run clean      # Remove dist/
```

Build output goes to `dist/`. Main entry: `dist/index.js`, types: `dist/index.d.ts`.

## Architecture

The library uses a **Manager + Facade** pattern:

- **`StashcatClient`** (`src/client/StashcatClient.ts`) — Public facade. Single entry point. Composes all managers, enforces auth checks, manages encryption key lifecycle.
- **`StashcatAPI`** (`src/api/request.ts`) — Low-level HTTP client. Wraps Axios, handles device ID, client_key injection, URL building, and response validation.
- **`AuthManager`** (`src/auth/login.ts`) — Login/logout, stores `client_key` and `device_id` in `AuthState`.
- **`ChannelManager`** (`src/chats/channels.ts`) — Fetch channels by `company_id`.
- **`ConversationManager`** (`src/chats/conversations.ts`) — Fetch conversations with pagination.
- **`MessageManager`** (`src/chats/messages.ts`) — Fetch messages (auto-decrypts if encrypted), download files.
- **`CryptoManager`** (`src/encryption/crypto.ts`) — Static methods for AES-256-CBC encrypt/decrypt, RSA key generation and signing, encoding utilities.

### Request Flow

1. `StashcatClient` checks `isAuthenticated()` → throws if false
2. Delegates to appropriate Manager
3. Manager calls `api.createAuthenticatedRequestData()` to inject `client_key` + `device_id`
4. `StashcatAPI.post()` sends form-urlencoded POST, validates `status.value === 'OK'`
5. Returns typed payload

### API Endpoints

All requests are POST with `Content-Type: application/x-www-form-urlencoded`:

| Endpoint                  | Manager             |
|---------------------------|---------------------|
| `/auth/login`             | AuthManager         |
| `/channels/subscripted`   | ChannelManager      |
| `/message/conversations`  | ConversationManager |
| `/message/content`        | MessageManager      |
| `/file/download`          | MessageManager      |

## Code Conventions

### Naming

- **Classes / Interfaces / Types**: PascalCase (`StashcatClient`, `AuthConfig`)
- **Methods / Properties / Variables**: camelCase (`getChannels`, `clientKey`)
- **API request/response fields**: snake_case (`device_id`, `client_key`, `company_id`)
- **Constants**: UPPERCASE_SNAKE_CASE (`ALGORITHM`)
- **Manager classes**: suffix with `Manager` (`ChannelManager`)

### TypeScript

- Strict mode is enabled — no implicit `any`, no unchecked indexing
- Avoid `any` in public API signatures; use `unknown` or proper types
- All API responses must have typed interfaces in the relevant `types.ts`
- Use optional chaining (`?.`) for nullable values
- Use `private` for internal class members

### Error Handling

```typescript
try {
  const data = this.api.createAuthenticatedRequestData({ /* params */ });
  const payload = await this.api.post<SomeType>(path, data);
  return payload;
} catch (error) {
  throw new Error(`Failed to X: ${error instanceof Error ? error.message : error}`);
}
```

- Wrap API calls in try-catch in manager classes
- `StashcatAPI.post()` already uses `axios.isAxiosError()` and validates `status.value === 'OK'`
- Error messages follow the pattern: `"Failed to X: ${error.message}"`

### Authentication Guards

Every `StashcatClient` public method must check auth before delegating:

```typescript
if (!this.isAuthenticated()) {
  throw new Error('Not authenticated. Please login first.');
}
```

## Key Files

```
src/
├── index.ts                   # Public export barrel — add exports here for new public APIs
├── api/
│   ├── request.ts            # StashcatAPI — HTTP layer, do not add business logic here
│   └── response.ts           # APIResponse, APIStatus interfaces
├── auth/
│   ├── login.ts              # AuthManager
│   └── types.ts              # LoginRequest, LoginResponse, AuthState, AuthConfig
├── chats/
│   ├── channels.ts           # ChannelManager
│   ├── conversations.ts      # ConversationManager
│   ├── messages.ts           # MessageManager
│   └── types.ts              # Channel, Conversation, Message, File, PaginationOptions
├── client/
│   └── StashcatClient.ts     # Main facade — primary entry point for users
└── encryption/
    └── crypto.ts             # CryptoManager — static crypto utilities
examples/                     # Usage examples (JS/TS), not part of the published package
dist/                         # Build output (git-ignored)
```

## Adding a New API Resource

1. **Create `src/<resource>/types.ts`** — Define request/response interfaces
2. **Create `src/<resource>/<resource>.ts`** — Implement a `*Manager` class:
   ```typescript
   import { StashcatAPI } from '../api/request';

   export class FooManager {
     constructor(private api: StashcatAPI) {}

     async getFoos(param: string): Promise<Foo[]> {
       try {
         const data = this.api.createAuthenticatedRequestData({ param });
         const payload = await this.api.post<{ foos: Foo[] }>('/foo/list', data);
         return payload.foos;
       } catch (error) {
         throw new Error(`Failed to get foos: ${error instanceof Error ? error.message : error}`);
       }
     }
   }
   ```
3. **Add manager to `StashcatClient`** (`src/client/StashcatClient.ts`):
   - Import and instantiate in constructor
   - Add public method with auth guard
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
    // ...
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

- Encryption key is generated automatically on `client.login()` via `CryptoManager.generateKey()`
- Messages are decrypted transparently in `MessageManager.getMessages()` when `encrypted: true` and a key is available
- The key is cleared on `client.logout()`
- `CryptoManager` methods are all static — no instantiation needed
- Uses Node.js built-in `crypto` module (no external crypto dependencies)
