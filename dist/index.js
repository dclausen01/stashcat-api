"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RealtimeManager = exports.CryptoManager = exports.SecurityManager = exports.PollManager = exports.CalendarManager = exports.BroadcastManager = exports.FileManager = exports.AccountManager = exports.UserManager = exports.MessageManager = exports.ConversationManager = exports.ChannelManager = exports.AuthManager = exports.StashcatAPI = exports.StashcatClient = void 0;
var StashcatClient_1 = require("./client/StashcatClient");
Object.defineProperty(exports, "StashcatClient", { enumerable: true, get: function () { return StashcatClient_1.StashcatClient; } });
var request_1 = require("./api/request");
Object.defineProperty(exports, "StashcatAPI", { enumerable: true, get: function () { return request_1.StashcatAPI; } });
// Auth
var login_1 = require("./auth/login");
Object.defineProperty(exports, "AuthManager", { enumerable: true, get: function () { return login_1.AuthManager; } });
// Chats
var channels_1 = require("./chats/channels");
Object.defineProperty(exports, "ChannelManager", { enumerable: true, get: function () { return channels_1.ChannelManager; } });
var conversations_1 = require("./chats/conversations");
Object.defineProperty(exports, "ConversationManager", { enumerable: true, get: function () { return conversations_1.ConversationManager; } });
var messages_1 = require("./chats/messages");
Object.defineProperty(exports, "MessageManager", { enumerable: true, get: function () { return messages_1.MessageManager; } });
// Users
var users_1 = require("./users/users");
Object.defineProperty(exports, "UserManager", { enumerable: true, get: function () { return users_1.UserManager; } });
// Account
var account_1 = require("./account/account");
Object.defineProperty(exports, "AccountManager", { enumerable: true, get: function () { return account_1.AccountManager; } });
// Files
var files_1 = require("./files/files");
Object.defineProperty(exports, "FileManager", { enumerable: true, get: function () { return files_1.FileManager; } });
// Broadcast
var broadcast_1 = require("./broadcast/broadcast");
Object.defineProperty(exports, "BroadcastManager", { enumerable: true, get: function () { return broadcast_1.BroadcastManager; } });
// Calendar
var calendar_1 = require("./calendar/calendar");
Object.defineProperty(exports, "CalendarManager", { enumerable: true, get: function () { return calendar_1.CalendarManager; } });
// Poll (Surveys)
var poll_1 = require("./poll/poll");
Object.defineProperty(exports, "PollManager", { enumerable: true, get: function () { return poll_1.PollManager; } });
// Security
var security_1 = require("./security/security");
Object.defineProperty(exports, "SecurityManager", { enumerable: true, get: function () { return security_1.SecurityManager; } });
// Encryption (EncryptionKey removed — no longer used internally)
var crypto_1 = require("./encryption/crypto");
Object.defineProperty(exports, "CryptoManager", { enumerable: true, get: function () { return crypto_1.CryptoManager; } });
// Realtime
var realtime_1 = require("./realtime/realtime");
Object.defineProperty(exports, "RealtimeManager", { enumerable: true, get: function () { return realtime_1.RealtimeManager; } });
//# sourceMappingURL=index.js.map