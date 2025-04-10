# Cloudflare Workflows - Human-in-the-Loop with waitForEvent
This template demonstrates how to build human-in-the-loop workflows using Cloudflare Workflows' `waitForEvent` API. It enables you to create durable, long-running workflows that can pause execution and wait for human input or external events before continuing.

## Repository Structure

This is a monorepo containing:
- `/nextjs-workflow-frontend`: Next.js application for the frontend interface
- `/workflow`: Cloudflare Workflow implementation

## What is waitForEvent?

The `waitForEvent` API is a powerful feature of Cloudflare Workflows that allows you to:
* Pause workflow execution indefinitely until a specific event is received
* Create human-in-the-loop workflows where manual approval or input is required
* Build event-driven applications that respond to external triggers
* Implement complex approval chains and decision points in your workflows

## Getting Started

**Visit the [get started guide](https://developers.cloudflare.com/workflows/get-started/guide/) for Workflows to create and deploy your first workflow.**

## Deployment

### Frontend Deployment
1. Navigate to the frontend directory:
   ```bash
   cd nextjs-workflow-frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Build the application:
   ```bash
   npm run build
   ```
4. Deploy to Cloudflare:
   ```bash
   npm run deploy
   ``` 

### Workflow Deployment
1. Navigate to the workflow directory:
   ```bash
   cd workflow
   ```
2. Create an R2 bucket, update `wrangler.jsonc` with the output from:
   ```bash
   npx wrangler r2 bucket create workflow-demo-bucket
   ```
3. Create a D1 database, update `wrangler.jsonc` with the output from:
   ```bash
   npx wrangler d1 create workflow-demo
   ```

5. Apply the database schema (run in the /workflow folder):
   ```bash
   npx wrangler d1 execute workflow-demo --remote --file=./db.sql
   ```
6. Deploy the workflow using Wrangler:
   ```bash
   npm run deploy
   ```
7. Update `constants.ts` with your Workflow base url and redeploy
   ```txt
    export const API_BASE_URL = '<your-workflow-url>';
   ```
## Reference Architecture
![workflow-diagram](https://github.com/user-attachments/assets/ffee1de3-a5a0-4727-bae0-cfbc665da308)

## Learn More

* Read the [Workflows GA announcement blog](https://blog.cloudflare.com/workflows-ga-production-ready-durable-execution/) to understand the core concepts
* Review the [Workflows developer documentation](https://developers.cloudflare.com/workflows/) for detailed API reference and examples
* Check out the [waitForEvent API documentation](https://developers.cloudflare.com/workflows/apis/wait-for-event/) for specific details about implementing human-in-the-loop workflows

