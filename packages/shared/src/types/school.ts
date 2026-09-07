import type { Role } from "../roles";

export type MessageKind =
  | "text"
  | "daily_activity"
  | "homework"
  | "progress"
  | "system";

export type HomeworkStatus =
  | "pending"
  | "in-progress"
  | "submitted"
  | "reviewed";

export type HomeworkPriority = "high" | "medium" | "low";

export interface ChatMessage {
  id: string;
  chatId: string;
  kind: MessageKind;
  text: string;
  senderId: string;
  senderName: string;
  senderRole: Role | "school" | "system";
  createdAt: number;
  pending?: boolean;
  failed?: boolean;
  readBy?: string[];
  meta?: {
    subject?: string;
    due?: string;
    status?: HomeworkStatus;
    score?: string;
    activityDate?: string;
  };
}

export interface ChatThread {
  id: string;
  title: string;
  subtitle: string;
  kind: "class" | "teacher" | "school" | "bus";
  className?: string;
  avatar: string;
  pinned?: boolean;
  muted?: boolean;
  lastMessageAt: number;
  unread: number;
}

export interface AppNotification {
  id: string;
  title: string;
  body: string;
  createdAt: number;
  read: boolean;
  type:
    | "homework"
    | "activity"
    | "progress"
    | "fees"
    | "circular"
    | "chat"
    | "system"
    | "bus";
  href?: string;
}

export interface HomeworkItem {
  id: string;
  subject: string;
  title: string;
  due: string;
  dueDate?: string;
  priority: HomeworkPriority;
  attachments: number;
  status: HomeworkStatus;
  className: string;
  postedBy: string;
  createdAt: number;
  notes?: string;
}

export interface FeeHistoryItem {
  title: string;
  date: string;
  amount: string;
}

export interface FeesPayload {
  termLabel: string;
  outstanding: string;
  outstandingPaise?: number;
  baseAmount: string;
  latePenalty: string;
  dueDateLabel: string;
  overdue: boolean;
  paidThisYear: string;
  totalAnnual: string;
  history: FeeHistoryItem[];
}

export interface AttendanceSummary {
  label: string;
  hint: string;
  present?: number;
  absent?: number;
  leave?: number;
}

export interface FeedItem {
  id: string;
  kind: string;
  title: string;
  meta: string;
  href: string;
  tone?: string;
  badge?: { label: string; className?: string };
}
