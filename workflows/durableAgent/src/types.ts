// Re-export shared types from worker for client use
// This avoids duplicating type definitions

export { AgentStatus } from "../worker/types";
export type {
  AgentState,
  WebSocketMessage,
  StartWorkflowRequest,
  StartWorkflowResponse,
  WorkflowStatusResponse,
} from "../worker/types";
