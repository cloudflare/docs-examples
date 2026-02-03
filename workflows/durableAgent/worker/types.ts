// Agent state for WebSocket communication
export interface AgentState {
  status: "idle" | "running" | "complete" | "error";
  message: string;
  result?: string;
  currentWorkflow?: string;
}

// Workflow result
export interface WorkflowResult {
  status: "complete" | "max_turns_reached";
  turns: number;
  result?: string | null;
}

// Broadcast message types from workflow/agent to clients
export interface ToolCallMessage {
  type: "tool_call";
  tool: string;
  turn: number;
}

export interface ProgressMessage {
  type: "progress";
  instanceId: string;
  progress: {
    step?: string;
    status?: string;
    percent?: number;
    message?: string;
  };
}

export interface CompleteMessage {
  type: "complete";
  instanceId: string;
  result?: WorkflowResult;
}

export interface ErrorMessage {
  type: "error";
  instanceId: string;
  error: string;
}

export type BroadcastMessage = ToolCallMessage | ProgressMessage | CompleteMessage | ErrorMessage;

// OpenAI-compatible types for AI Gateway
export interface ChatMessage {
  role: "system" | "user" | "assistant" | "tool";
  content: string | null;
  tool_calls?: ToolCall[];
  tool_call_id?: string;
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
      tool_calls?: ToolCall[];
    };
    finish_reason: "stop" | "tool_calls" | "length" | "content_filter";
  }[];
}

