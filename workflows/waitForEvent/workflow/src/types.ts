import { WorkflowEntrypoint, WorkflowStep, WorkflowEvent } from 'cloudflare:workers';

// Base response type for all API responses
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// Workflow related types
export interface WorkflowParams {
  imageKey: string;
}

export interface WorkflowEventPayload {
  type: string;
  payload: Record<string, any>;
}

export interface WorkflowInstance {
  id: string;
  status: () => Promise<WorkflowStatus>;
  sendEvent: (event: WorkflowEventPayload) => Promise<void>;
  get: (id: string) => Promise<WorkflowInstance>;
  create: (params: { params: WorkflowParams }) => Promise<WorkflowInstance>;
}

export interface WorkflowStatus {
  id: string;
  details: Record<string, any>;
  success: boolean;
  message: string;
}

// Database related types
export interface ImageRecord {
  ImageKey: string;
  InstanceID: string;
  ImageTags?: string;
}

// Environment bindings
export interface Env {
  MY_WORKFLOW: WorkflowInstance;
  workflow_demo_bucket: R2Bucket;
  DB: D1Database;
  AI: Ai;
}

// Request/Response types
export interface ApprovalRequest {
  instanceId: string;
  approved: boolean;
}

// Consolidated response types
export interface TagsResponse {
  instanceId: string;
  tags: string | null;
}

// Use ApiResponse<T> for all API responses
export type TagsApiResponse = ApiResponse<TagsResponse>;
export type ApprovalApiResponse = ApiResponse<{ success: boolean }>;
export type WorkflowStatusApiResponse = ApiResponse<WorkflowStatus>;

