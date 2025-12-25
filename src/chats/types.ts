export interface Channel {
  id: string;
  name: string;
  description?: string;
  company_id: string;
  created_at: string;
  updated_at: string;
  members: ChannelMember[];
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
  type: 'direct' | 'group';
  name?: string;
  participants: ConversationParticipant[];
  last_message?: Message;
  created_at: string;
  updated_at: string;
}

export interface ConversationParticipant {
  id: string;
  user_id: string;
  conversation_id: string;
  joined_at: string;
  left_at?: string;
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
}

export interface MessageSender {
  id: string;
  name: string;
  email: string;
}

export interface File {
  id: string;
  name: string;
  size: number;
  mime_type: string;
  encrypted: boolean;
  e2e_iv?: string;
  created_at: string;
  updated_at: string;
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
