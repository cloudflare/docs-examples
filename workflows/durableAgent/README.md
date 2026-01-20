# Cloudflare Workflows - Durable AI Agent

This template demonstrates how to build a durable AI agent using Cloudflare Workflows. The agent loop is checkpointed at each LLM turn and tool call, providing automatic retries and error handling. Real-time progress updates are broadcast to connected clients via a Durable Object using the Agents SDK.

## Cloudflare Services Used

- Workflows
- AI Gateway
- Agents SDK
- Durable Objects
- Workers

## Repository Structure

- `/worker`: Workflow definition, Durable Object agent, and API routes
- `/src`: React frontend (Vite)

## What is a Durable Agent?

A durable agent combines Cloudflare Workflows with an AI agent loop to create fault-tolerant, long-running AI tasks. Each step in the agent loop (LLM calls, tool executions) is checkpointed, so if a failure occurs, the workflow resumes from the last successful step rather than starting over.

This template includes:

- A checkpointed agent loop with configurable max turns
- Automatic retries with exponential backoff for LLM calls
- Tool calling (GitHub repository search and details)
- Real-time progress updates via WebSocket using a Durable Object

## Clone only the durableAgent folder within the docs-examples repository

1. Clone the repository without checking out files:

   ```bash
   git clone --filter=blob:none --no-checkout https://github.com/cloudflare/docs-examples.git
   cd docs-examples
   ```

2. Enable sparse checkout:

   ```bash
   git sparse-checkout init --cone
   ```

3. Specify the folder you want:

   ```bash
   git sparse-checkout set workflows/durableAgent
   ```

4. Check out the branch (`main`):

   ```bash
   git checkout main
   ```

## Deployment

[![Deploy to Cloudflare](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/cloudflare/docs-examples/tree/main/workflows/durableAgent)

### Prerequisites

1. Set up an [AI Gateway](https://developers.cloudflare.com/ai-gateway/get-started/) in your Cloudflare account.

2. You will need the following values:
   - `CF_ACCOUNT_ID`: Your Cloudflare account ID
   - `CF_GATEWAY_ID`: The name of your AI Gateway
   - `AI_GATEWAY_TOKEN`: An API token with AI Gateway permissions

### Deploy

1. Navigate to the durableAgent directory:

   ```bash
   cd workflows/durableAgent
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Set your secrets:

   ```bash
   npx wrangler secret put CF_ACCOUNT_ID
   npx wrangler secret put CF_GATEWAY_ID
   npx wrangler secret put AI_GATEWAY_TOKEN
   ```

4. Deploy:

   ```bash
   npm run deploy
   ```

### Local Development

1. Copy `.dev.vars.example` to `.dev.vars` and fill in your values:

   ```bash
   cp .dev.vars.example .dev.vars
   ```

2. Run the development server:

   ```bash
   npm run dev
   ```

## Learn More

- [Workflows documentation](https://developers.cloudflare.com/workflows/)
- [AI Gateway documentation](https://developers.cloudflare.com/ai-gateway/)
- [Agents SDK documentation](https://developers.cloudflare.com/agents/)
- [Durable Objects documentation](https://developers.cloudflare.com/durable-objects/)
