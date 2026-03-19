import type { AttentionQueueItem } from "@/lib/attention-queue";

export interface DashboardKpis {
  totalLeads: number;
  newLeads: number;
  qualifiedLeads: number;
  wonLeads: number;
  hotLeads: number;
  unreadConversations: number;
  pipelineValue: number;
}

export interface DashboardRecentLead {
  id: string;
  name: string;
  phone: string;
  status: string;
  score: number;
  source: string;
  createdAt: string;
  pipelineStage?: {
    name: string;
    color: string;
  } | null;
  conversation?: {
    unreadCount: number;
    lastMessageAt: string | null;
  } | null;
}

export interface DashboardRecentActivity {
  id: string;
  type: string;
  title: string;
  description?: string | null;
  createdAt: string;
  lead?: {
    name: string;
  } | null;
}

export interface DashboardData {
  kpis: DashboardKpis;
  recentLeads: DashboardRecentLead[];
  recentActivities: DashboardRecentActivity[];
}

export type DashboardAttentionQueue = AttentionQueueItem[];
