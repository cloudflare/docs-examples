import { Agent } from "agents";
import { AgentStatus } from "./types";
import type { AgentState, ProgressUpdate } from "./types";

export class ResearchAgent extends Agent<Env, AgentState> {
  initialState: AgentState = { status: AgentStatus.IDLE, message: "" };

  async reset(): Promise<void> {
    this.setState({ status: AgentStatus.IDLE, message: "" });
  }

  async updateProgress(progress: ProgressUpdate): Promise<void> {
    this.setState({ ...this.state, ...progress } as AgentState);
  }
}
