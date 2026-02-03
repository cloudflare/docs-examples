import { Agent, callable } from "agents";
import type { AgentState } from "./types";

export class ResearchAgent extends Agent<Env, AgentState> {
  initialState: AgentState = { status: "idle", message: "" };

  @callable()
  async startResearch(task: string) {
    const instanceId = await this.runWorkflow("RESEARCH_WORKFLOW", { task });
    this.setState({ status: "running", message: "Starting research...", currentWorkflow: instanceId });
    return { instanceId };
  }

  @callable()
  async reset() {
    if (this.state.currentWorkflow) {
      try {
        await this.terminateWorkflow(this.state.currentWorkflow);
      } catch (e) {
        console.warn("Failed to terminate workflow:", e);
      }
    }
    this.setState({ status: "idle", message: "" });
  }
}
