import { routeAgentRequest } from "agents";

export { ResearchAgent } from "./agent";
export { ResearchWorkflow } from "./workflow";

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    // Route all requests to agents (WebSocket + HTTP)
    const response = await routeAgentRequest(request, env);
    if (response) return response;

    return new Response("Not found", { status: 404 });
  },
} satisfies ExportedHandler<Env>;
