export { AgentWorkflow } from "./workflow";
export { ResearchAgent } from "./agent";

import { routeAgentRequest } from "agents";
import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { StartWorkflowRequestSchema, ResetRequestSchema } from "./types";
import type { StartWorkflowResponse, WorkflowStatusResponse } from "./types";
import { DEFAULT_AGENT_ID } from "./constants";

const app = new Hono<{ Bindings: Env }>();

// Agent WebSocket connections (handled by Agents SDK)
app.all("/agents/*", async (c) => {
  const response = await routeAgentRequest(c.req.raw, c.env);
  return response ?? new Response("Not found", { status: 404 });
});

// Reset workflow and agent state
app.post("/api/reset", zValidator("json", ResetRequestSchema), async (c) => {
  const body = c.req.valid("json");

  // Terminate workflow if instanceId provided
  if (body.instanceId) {
    try {
      const instance = await c.env.AGENT_WORKFLOW.get(body.instanceId);
      await instance.terminate();
    } catch {
      // terminate() not implemented in local dev
    }
  }

  // Reset agent state using RPC
  const id = c.env.RESEARCH_AGENT.idFromName(DEFAULT_AGENT_ID);
  const agent = c.env.RESEARCH_AGENT.get(id);
  await agent.reset();

  return c.text("OK");
});

// Check workflow status (GET /api?instanceId=...)
app.get("/api", async (c) => {
  const instanceId = c.req.query("instanceId");
  if (!instanceId) {
    return c.text("Invalid API request", 400);
  }

  const instance = await c.env.AGENT_WORKFLOW.get(instanceId);
  const status = await instance.status();

  const response: WorkflowStatusResponse = {
    status: status.status,
    output: status.output,
  };
  return c.json(response);
});

// Start new workflow (POST /api)
app.post("/api", zValidator("json", StartWorkflowRequestSchema), async (c) => {
  const body = c.req.valid("json");

  const instance = await c.env.AGENT_WORKFLOW.create({
    params: { task: body.task, agentId: DEFAULT_AGENT_ID },
  });

  const response: StartWorkflowResponse = { instanceId: instance.id };
  return c.json(response);
});

// Let the Vite plugin handle static assets
app.all("*", () => new Response(null, { status: 404 }));

export default app;
