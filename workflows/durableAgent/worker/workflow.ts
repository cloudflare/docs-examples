import { AgentWorkflow } from "agents/workflows";
import type { AgentWorkflowEvent, AgentWorkflowStep } from "agents/workflows";
import {
  tools,
  searchReposTool,
  getRepoTool,
  isSearchReposInput,
  isGetRepoInput,
} from "./tools";
import type {
  WorkflowResult,
  ChatMessage,
  ChatCompletionRequest,
  ChatCompletionResponse,
  ToolDefinition,
} from "./types";
import type { ResearchAgent } from "./agent";

function isChatCompletionResponse(v: unknown): v is ChatCompletionResponse {
  if (v === null || typeof v !== "object") return false;
  const r = v as Partial<ChatCompletionResponse>;
  return typeof r.id === "string" && typeof r.model === "string" && Array.isArray(r.choices);
}

const MAX_TURNS = 10;

type Params = { task: string };

export class ResearchWorkflow extends AgentWorkflow<ResearchAgent, Params> {
  private getAIGatewayUrl(): string {
    return `https://gateway.ai.cloudflare.com/v1/${this.env.CF_ACCOUNT_ID}/${this.env.CF_GATEWAY_ID}/compat/chat/completions`;
  }

  private async callAIGateway(request: ChatCompletionRequest): Promise<ChatCompletionResponse> {
    const response = await fetch(this.getAIGatewayUrl(), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "cf-aig-authorization": `Bearer ${this.env.AI_GATEWAY_TOKEN}`,
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`AI Gateway error (${response.status}): ${errorText}`);
    }

    return response.json();
  }

  private getToolDefinitions(): ToolDefinition[] {
    return tools.map((tool) => ({
      type: "function" as const,
      function: {
        name: tool.name,
        description: tool.description,
        parameters: {
          type: tool.input_schema.type,
          properties: tool.input_schema.properties,
          required: tool.input_schema.required,
        },
      },
    }));
  }

  async run(event: AgentWorkflowEvent<Params>, step: AgentWorkflowStep): Promise<WorkflowResult> {
    const messages: ChatMessage[] = [
      { role: "user", content: event.payload.task },
    ];

    const toolDefinitions = this.getToolDefinitions();

    for (let turn = 0; turn < MAX_TURNS; turn++) {
      // Update agent state (durable, broadcasts to clients)
      await step.mergeAgentState({
        status: "running",
        message: `Processing turn ${turn + 1}...`,
      });

      const stepResult = await step.do(
        `llm-turn-${turn}`,
        { retries: { limit: 3, delay: "10 seconds", backoff: "exponential" } },
        async () => {
          const request: ChatCompletionRequest = {
            model: "anthropic/claude-sonnet-4-5-20250929",
            max_tokens: 4096,
            messages,
            tools: toolDefinitions,
          };
          const result = await this.callAIGateway(request);
          return JSON.parse(JSON.stringify(result));
        },
      );

      if (!isChatCompletionResponse(stepResult)) {
        console.error("Invalid response from AI Gateway:", stepResult);
        continue;
      }

      const choice = stepResult.choices[0];
      if (!choice) continue;

      messages.push({
        role: "assistant",
        content: choice.message.content,
        ...(choice.message.tool_calls && { tool_calls: choice.message.tool_calls }),
      });

      // Done - no tool calls
      if (choice.finish_reason === "stop" || !choice.message.tool_calls?.length) {
        const result: WorkflowResult = {
          status: "complete",
          turns: turn + 1,
          result: choice.message.content ?? null,
        };

        // Update agent state with result (durable)
        await step.mergeAgentState({
          status: "complete",
          message: "Complete",
          result: choice.message.content ?? undefined,
        });

        return result;
      }

      // Process tool calls
      for (const toolCall of choice.message.tool_calls) {
        // Broadcast tool execution to clients (non-durable)
        this.broadcastToClients({ type: "tool_call", tool: toolCall.function.name, turn });

        const toolResult = await step.do(
          `tool-${turn}-${toolCall.id}`,
          { retries: { limit: 2, delay: "5 seconds" } },
          async () => {
            const args: unknown = JSON.parse(toolCall.function.arguments);
            switch (toolCall.function.name) {
              case "search_repos":
                return isSearchReposInput(args) ? searchReposTool.run(args) : "Invalid arguments";
              case "get_repo":
                return isGetRepoInput(args) ? getRepoTool.run(args) : "Invalid arguments";
              default:
                return `Unknown tool: ${toolCall.function.name}`;
            }
          },
        );

        messages.push({ role: "tool", content: toolResult, tool_call_id: toolCall.id });
      }
    }

    // Max turns reached
    await step.mergeAgentState({ status: "error", message: "Max turns reached" });
    return { status: "max_turns_reached", turns: MAX_TURNS };
  }
}
