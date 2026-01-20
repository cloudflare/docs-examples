import { DurableObject } from "cloudflare:workers";
import { AgentStatus } from "./types";
import type { AgentState, WebSocketMessage, ProgressUpdate } from "./types";

export class ResearchAgent extends DurableObject {
  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env);
    // Initialize state from storage on first access
    this.ctx.blockConcurrencyWhile(async () => {
      const storedState = await this.ctx.storage.get<AgentState>("state");
      if (!storedState) {
        // Initialize with default state if nothing is stored
        await this.ctx.storage.put("state", { status: AgentStatus.IDLE, message: "" });
      }
    });
  }

  private async getState(): Promise<AgentState> {
    const state = await this.ctx.storage.get<AgentState>("state");
    return state ?? { status: AgentStatus.IDLE, message: "" };
  }

  private async setState(state: AgentState): Promise<void> {
    await this.ctx.storage.put("state", state);
  }

  async fetch(request: Request): Promise<Response> {
    // Only handle WebSocket upgrades in fetch handler
    if (request.headers.get("Upgrade") === "websocket") {
      const pair = new WebSocketPair();
      const [client, server] = Object.values(pair);

      if (!server || !client) {
        return new Response("WebSocket initialization failed", { status: 500 });
      }

      // Use WebSocket Hibernation API
      this.ctx.acceptWebSocket(server);

      // Send current state to new connection
      const state = await this.getState();
      const message: WebSocketMessage = { type: "state", data: state };
      server.send(JSON.stringify(message));

      return new Response(null, { status: 101, webSocket: client as WebSocket });
    }

    return new Response("Not found", { status: 404 });
  }

  // RPC method: Reset agent state
  async reset(): Promise<void> {
    await this.setState({ status: AgentStatus.IDLE, message: "" });
    await this.broadcast();
  }

  // WebSocket Hibernation API handlers
  async webSocketMessage(_ws: WebSocket, _message: string | ArrayBuffer): Promise<void> {
    // Handle incoming WebSocket messages if needed
    // Currently not processing any client messages
  }

  async webSocketClose(ws: WebSocket, code: number, reason: string, _wasClean: boolean): Promise<void> {
    // WebSocket closed - hibernation API handles cleanup automatically
    ws.close(code, reason);
  }

  async webSocketError(ws: WebSocket, _error: unknown): Promise<void> {
    // WebSocket error - close the connection
    ws.close(1011, "WebSocket error occurred");
  }

  // RPC method: Update agent progress
  async updateProgress(progress: ProgressUpdate): Promise<void> {
    const currentState = await this.getState();
    const newState = { ...currentState, ...progress } as AgentState;
    await this.setState(newState);
    await this.broadcast();
  }

  private async broadcast(): Promise<void> {
    const state = await this.getState();
    const message: WebSocketMessage = { type: "state", data: state };
    const messageStr = JSON.stringify(message);

    // Use getWebSockets() to get all connected WebSockets
    const webSockets = this.ctx.getWebSockets();
    for (const ws of webSockets) {
      try {
        ws.send(messageStr);
      } catch {
        // If send fails, close the WebSocket
        ws.close(1011, "Failed to send message");
      }
    }
  }
}
