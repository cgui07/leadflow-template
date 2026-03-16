export interface LeadRow {
  id: string;
  name: string;
  phone: string;
  email?: string | null;
  status: string;
  score: number;
  source: string;
  region?: string | null;
  value?: number | null;
  createdAt: string;
  pipelineStage?: { name: string; color: string } | null;
  conversation?: {
    unreadCount: number;
    lastMessageAt: string | null;
  } | null;
}

export interface LeadsResponse {
  leads: LeadRow[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export interface LeadDetail {
  id: string;
  name: string;
  phone: string;
  email?: string | null;
  status: string;
  score: number;
  source: string;
  value?: number | null;
  region?: string | null;
  priceMin?: number | null;
  priceMax?: number | null;
  propertyType?: string | null;
  purpose?: string | null;
  timeline?: string | null;
  bedrooms?: number | null;
  notes?: string | null;
  lastContactAt?: string | null;
  nextFollowUpAt?: string | null;
  followUpCount: number;
  createdAt: string;
  pipelineStage?: { id: string; name: string; color: string } | null;
  conversation?: {
    id: string;
    status: string;
    messages: Array<{
      id: string;
      direction: string;
      sender: string;
      content: string;
      createdAt: string;
    }>;
  } | null;
  activities: Array<{
    id: string;
    type: string;
    title: string;
    description?: string | null;
    createdAt: string;
  }>;
  tasks: Array<{
    id: string;
    title: string;
    type: string;
    status: string;
    dueAt: string;
  }>;
  leadActions: Array<{
    id: string;
    type: string;
    status: string;
    title: string;
    notes?: string | null;
    origin: string;
    scheduledAt?: string | null;
    reminderAt?: string | null;
    completedAt?: string | null;
    createdAt: string;
    updatedAt: string;
  }>;
}

export interface LeadsListParams {
  limit?: number;
  order?: string;
  page?: number;
  search?: string | null;
  sort?: string;
  status?: string | null;
}
