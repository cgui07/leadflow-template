export type LeadStatus =
  | "new"
  | "contacted"
  | "qualified"
  | "proposal"
  | "negotiation"
  | "won"
  | "lost";

export type LeadSource =
  | "website"
  | "referral"
  | "social"
  | "ads"
  | "manual"
  | "other";

export interface Lead {
  id: string;
  name: string;
  email: string;
  phone?: string;
  company?: string;
  status: LeadStatus;
  source: LeadSource;
  value?: number;
  assignedTo?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface PipelineStage {
  id: string;
  name: string;
  order: number;
  color: string;
  leadCount: number;
  totalValue: number;
}

export type MessageType = "text" | "image" | "video" | "audio" | "document" | "sticker";
export type MessageDirection = "sent" | "received";
export type MessageStatus = "sending" | "sent" | "delivered" | "read" | "failed";

export interface Message {
  id: string;
  content: string;
  type: MessageType;
  direction: MessageDirection;
  status: MessageStatus;
  timestamp: Date;
  sender: {
    id: string;
    name: string;
    avatar?: string;
  };
}

export interface Conversation {
  id: string;
  contact: {
    id: string;
    name: string;
    avatar?: string;
    phone?: string;
    email?: string;
    status?: "online" | "offline" | "away";
  };
  lastMessage?: Message;
  unreadCount: number;
  updatedAt: Date;
}

export type ActivityType =
  | "call"
  | "email"
  | "note"
  | "meeting"
  | "task"
  | "status_change"
  | "message";

export interface Activity {
  id: string;
  type: ActivityType;
  title: string;
  description?: string;
  timestamp: Date;
  user: {
    name: string;
    avatar?: string;
  };
  metadata?: Record<string, unknown>;
}

export interface Column<T> {
  key: keyof T | string;
  label: string;
  sortable?: boolean;
  render?: (value: unknown, row: T) => React.ReactNode;
  className?: string;
}

export interface SelectOption {
  label: string;
  value: string;
  disabled?: boolean;
}
