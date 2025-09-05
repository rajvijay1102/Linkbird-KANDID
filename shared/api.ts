/**
 * Shared code between client and server
 * Useful to share types between client and server
 * and/or small pure JS functions that can be used on both client and server
 */

export interface DemoResponse {
  message: string;
}

// Lead and Campaign domain models
export type LeadStatus = "new" | "contacted" | "responded" | "qualified" | "lost";

export interface Lead {
  id: string;
  name: string;
  company: string;
  role: string;
  email: string;
  location: string;
  status: LeadStatus;
  score: number; // 0..100
  lastActivity: string; // ISO date
  notes: string;
}

export interface Campaign {
  id: string;
  name: string;
  createdAt: string; // ISO date
  leads: number;
  sent: number;
  opened: number;
  replied: number;
  status: "draft" | "running" | "paused" | "completed";
}

export interface PaginatedRequest {
  page?: number;
  limit?: number;
}

export interface LeadsQuery extends PaginatedRequest {
  q?: string;
  status?: LeadStatus | "all";
}

export interface PaginatedResponse<T> {
  items: T[];
  page: number;
  hasMore: boolean;
  total: number;
}
