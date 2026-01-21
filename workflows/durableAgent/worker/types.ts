import { z } from "zod";

// Agent status constants
export const AgentStatus = {
  IDLE: "idle",
  RUNNING: "running",
  SEARCHING: "searching",
  ANALYZING: "analyzing",
  FETCHING: "fetching",
  COMPLETE: "complete",
  ERROR: "error",
} as const;

export type AgentStatus = (typeof AgentStatus)[keyof typeof AgentStatus];

// Agent state for WebSocket communication
export interface AgentState {
  status: AgentStatus;
  message: string;
  result?: string;
}

// API types
export interface StartWorkflowRequest {
  task: string;
}

export interface StartWorkflowResponse {
  instanceId: string;
}

export interface WorkflowStatusResponse {
  status: string;
  output: unknown;
}

// Workflow result
export interface WorkflowResult {
  status: "complete" | "max_turns_reached";
  turns: number;
  result?: string | null;
}

// Progress update from workflow to agent
export interface ProgressUpdate {
  status: string;
  message: string;
  result?: string | undefined;
}

// OpenAI-compatible types for AI Gateway
// See: https://platform.openai.com/docs/api-reference/chat

export interface ChatMessage {
  role: "system" | "user" | "assistant" | "tool";
  content: string | null;
  tool_calls?: ToolCall[] | undefined;
  tool_call_id?: string | undefined;
}

export interface ToolCall {
  id: string;
  type: "function";
  function: {
    name: string;
    arguments: string;
  };
}

export interface ToolDefinition {
  type: "function";
  function: {
    name: string;
    description: string;
    parameters: {
      type: string;
      properties: Record<string, unknown>;
      required?: string[];
    };
  };
}

export interface ChatCompletionRequest {
  model: string;
  messages: ChatMessage[];
  max_tokens?: number;
  tools?: ToolDefinition[];
}

export interface ChatCompletionResponse {
  id: string;
  model: string;
  choices: {
    message: {
      role: "assistant";
      content: string | null;
      tool_calls?: ToolCall[] | undefined;
    };
    finish_reason: "stop" | "tool_calls" | "length" | "content_filter";
  }[];
}

// Zod schemas for validation

export const StartWorkflowRequestSchema = z.object({
  task: z.string().min(1, "Task must not be empty"),
});

export const ProgressUpdateSchema = z.object({
  status: z.string(),
  message: z.string(),
  result: z.string().optional(),
});

export const ResetRequestSchema = z.object({
  instanceId: z.string().optional(),
});

// Type guards (kept for ChatCompletionResponse which is used in workflow.ts)

export function isChatCompletionResponse(v: unknown): v is ChatCompletionResponse {
  if (v === null || typeof v !== "object") return false;
  const r = v as Partial<ChatCompletionResponse>;
  return typeof r.id === "string" && typeof r.model === "string" && Array.isArray(r.choices);
}
