import { WorkflowEntrypoint } from "cloudflare:workers";
import type { WorkflowStep } from "cloudflare:workers";
import type { WorkflowEvent } from "cloudflare:workers";
import {
  tools,
  searchReposTool,
  getRepoTool,
  isSearchReposInput,
  isGetRepoInput,
} from "./tools";
import { isChatCompletionResponse } from "./types";
import type {
  WorkflowResult,
  ProgressUpdate,
  ChatMessage,
  ChatCompletionRequest,
  ChatCompletionResponse,
  ToolDefinition,
} from "./types";
import { MAX_AGENT_TURNS } from "./constants";

type Params = { task: string; agentId: string };

export class AgentWorkflow extends WorkflowEntrypoint<Env, Params> {
  private getAIGatewayUrl(): string {
    // Use the compat endpoint for unified billing with OpenAI-compatible format
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

  // Convert our tool definitions to OpenAI format
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

  async run(event: WorkflowEvent<Params>, step: WorkflowStep): Promise<WorkflowResult> {
    const messages: ChatMessage[] = [
      { role: "user", content: event.payload.task },
    ];

    const toolDefinitions = this.getToolDefinitions();

    // Get agent for real-time updates
    const agentId = event.payload.agentId;
    const id = this.env.RESEARCH_AGENT.idFromName(agentId);
    const agent = this.env.RESEARCH_AGENT.get(id);

    // Send initial status (clear any previous result)
    const initialUpdate: ProgressUpdate = {
      status: "searching",
      message: "Starting analysis...",
      result: ""
    };
    await agent.updateProgress(initialUpdate);

    // Durable agent loop - each turn is checkpointed
    for (let turn = 0; turn < MAX_AGENT_TURNS; turn++) {
      // Update status for each turn
      const turnUpdate: ProgressUpdate = {
        status: "analyzing",
        message: `Processing turn ${turn + 1}...`
      };
      await agent.updateProgress(turnUpdate);

      const stepResult = await step.do(
        `llm-turn-${turn}`,
        { retries: { limit: 3, delay: "10 seconds", backoff: "exponential" } },
        async () => {
          const request: ChatCompletionRequest = {
            // Use anthropic/ prefix for unified billing compat endpoint
            model: "anthropic/claude-sonnet-4-5-20250929",
            max_tokens: 4096,
            messages,
            tools: toolDefinitions,
          };
          const result = await this.callAIGateway(request);
          // Serialize for Workflow state
          return JSON.parse(JSON.stringify(result));
        },
      );

      if (!isChatCompletionResponse(stepResult)) {
        console.error("Invalid response from AI Gateway:", stepResult);
        continue;
      }
      const response = stepResult;

      if (response.choices.length === 0) continue;

      const choice = response.choices[0];
      if (!choice) continue;

      const assistantMessage: ChatMessage = {
        role: "assistant",
        content: choice.message.content,
        tool_calls: choice.message.tool_calls,
      };
      messages.push(assistantMessage);

      // Check if the model is done (no tool calls)
      if (choice.finish_reason === "stop" || !choice.message.tool_calls || choice.message.tool_calls.length === 0) {
        // Send completion status
        const completeUpdate: ProgressUpdate = {
          status: "complete",
          message: "Analysis complete!",
          result: choice.message.content ?? undefined
        };
        await agent.updateProgress(completeUpdate);

        return {
          status: "complete",
          turns: turn + 1,
          result: choice.message.content ?? null,
        };
      }

      // Process tool calls
      const toolCalls = choice.message.tool_calls;
      if (!toolCalls) continue;

      for (const toolCall of toolCalls) {
        // Send tool usage update
        const toolUpdate: ProgressUpdate = {
          status: "fetching",
          message: `Using tool: ${toolCall.function.name}...`
        };
        await agent.updateProgress(toolUpdate);

        const toolResult = await step.do(
          `tool-${turn}-${toolCall.id}`,
          { retries: { limit: 2, delay: "5 seconds" } },
          async () => {
            const args: unknown = JSON.parse(toolCall.function.arguments);
            switch (toolCall.function.name) {
              case "search_repos":
                if (!isSearchReposInput(args)) {
                  return "Invalid arguments for search_repos";
                }
                return searchReposTool.run(args);
              case "get_repo":
                if (!isGetRepoInput(args)) {
                  return "Invalid arguments for get_repo";
                }
                return getRepoTool.run(args);
              default:
                return `Unknown tool: ${toolCall.function.name}`;
            }
          },
        );

        // Add tool result as a message
        const toolMessage: ChatMessage = {
          role: "tool",
          content: toolResult,
          tool_call_id: toolCall.id,
        };
        messages.push(toolMessage);
      }
    }

    return { status: "max_turns_reached", turns: MAX_AGENT_TURNS };
  }
}
