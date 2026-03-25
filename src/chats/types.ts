export interface Channel {
  id: string;
  name: string;
  description?: string;
  company_id: string;
  created_at: string;
  updated_at: string;
  members: ChannelMember[];
  type?: string;
  visible?: boolean;
  writable?: boolean;
  encrypted?: boolean;
  inviteable?: boolean;
  owner_id?: string;
  image?: string;
  unread_count?: number;
  last_message?: Message;
  favorite?: boolean;
  member_count?: number;
  /**
   * RSA-OAEP encrypted AES key (base64) for this channel.
   * Same mechanism as Conversation.key — decrypt with RSA private key to get 32-byte AES key.
   * null for non-encrypted channels.
   */
  key?: string | null;
  key_requested?: string | null;
  key_signature?: string | null;
  key_sender?: number | null;
  signature_expiry?: string | null;
}

export interface ChannelMember {
  id: string;
  user_id: string;
  channel_id: string;
  role: string;
  joined_at: string;
}

export interface Conversation {
  id: string;
  type?: 'direct' | 'group';
  name?: string;
  participants?: ConversationParticipant[];
  last_message?: Message;
  created_at?: string;
  updated_at?: string;
  /** Unix timestamp of creation */
  created?: string;
  /** Unix timestamp of last action */
  last_action?: string;
  last_activity?: string;
  /** Number of unread messages in this conversation */
  unread_count?: number;
  unread_messages?: number;
  /** Whether the conversation is archived */
  archived?: boolean;
  archive?: boolean | null;
  /** Whether the conversation is a favorite */
  is_favorite?: boolean;
  favorite?: boolean;
  /** Whether the conversation is encrypted */
  encrypted?: boolean;
  /**
   * RSA-OAEP encrypted AES key (base64) for this conversation.
   * Decrypt with the user's RSA private key to get the 32-byte AES session key.
   * Then use that key to decrypt individual messages.
   */
  key?: string | null;
  /** Key request state */
  key_requested?: string | null;
  /** Signature of the conversation key */
  key_signature?: string | null;
  /** User ID who sent the key */
  key_sender?: number | null;
  signature_expiry?: string | null;
  /** Unique identifier for key material (hex) */
  unique_identifier?: string | null;
  deleted?: string | null;
  muted?: boolean | null;
  user_count?: number;
  members?: unknown[];
  num_members_without_keys?: number;
  is_marked_as_unread?: boolean;
}

export interface ConversationParticipant {
  id: string;
  user_id: string;
  conversation_id: string;
  joined_at: string;
  left_at?: string;
}

export interface MessageFile {
  id: string;
  name: string;
  /** Dateigröße als lesbarer String (z. B. "63 kb") */
  size_string?: string;
  /** Dateigröße in Bytes als String */
  size_byte?: string;
  /** MIME-Typ (API-Feld heißt "mime", nicht "mime_type") */
  mime?: string;
  /** Dateiendung ohne Punkt */
  ext?: string;
  encrypted?: boolean;
  e2e_iv?: string | null;
  /** Ordner-Typ des Speichers, z. B. "channel" oder "conversation" */
  folder_type?: string;
  type_id?: string;
  owner_id?: string;
  md5?: string;
  uploaded?: string;
  modified?: string;
  deleted?: string | null;
}

export interface Message {
  id: string;
  text: string;
  original_text?: string;
  sender: MessageSender | string;
  conversation_id?: string;
  channel_id?: string;
  created_at: string;
  updated_at: string;
  encrypted?: boolean;
  iv?: string;
  hash?: string;
  verification?: string;
  /** Attached files */
  files?: MessageFile[];
  /** ID of the message this is a reply to */
  reply_to_id?: string;
  /** Number of likes */
  likes?: number;
  /** Whether the current user has liked this message */
  liked?: boolean;
  /** Whether the current user has flagged this message */
  flagged?: boolean;
  /** Whether the message has been edited */
  edited?: boolean;
  /** Unix timestamp in seconds */
  time?: number;
  /** Microsecond-precision timestamp */
  micro_time?: number;
  /** Message kind (e.g. 'text') */
  kind?: string;
  /** Message type */
  type?: string;
  location?: unknown;
  tags?: unknown[];
  links?: unknown[];
  seen_by_others?: boolean;
  unread?: boolean;
  is_forwarded?: boolean;
  reactions?: unknown[];
  channel?: unknown;
  broadcast?: unknown;
  alarm?: boolean;
  confirmation_required?: boolean;
  thread_id?: string;
  is_deleted_by_manager?: boolean;
  has_file_attached?: boolean;
}

export interface MessageLiker {
  user: {
    id: string;
    first_name: string;
    last_name: string;
    image?: string;
    deleted?: string | null;
    online?: boolean;
  };
  liked_at: number;
}

export interface MessageSender {
  id: string;
  /** Vollständiger Name (manchmal befüllt) */
  name?: string;
  first_name?: string;
  last_name?: string;
  email?: string;
}

export interface PaginationOptions {
  limit?: number;
  offset?: number;
  archive?: number;
  sorting?: string[];
}

export interface ChatType {
  Channel: 'channel';
  Conversation: 'conversation';
}