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


### Workflow Deployment
[![Deploy to Cloudflare](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/thomas-desmond/docs-examples/tree/main/workflows/waitForEvent/workflow)

If you use the Deploy to Cloudflare button, you only need to complete "Step 4: Apply database schema" replacing `workflow-demo` with your database name. Deploying via the button will take care of creating the R2 bucket and empty D1 database.

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
4. Apply the database schema (run in the /workflow folder):
   ```bash
   npx wrangler d1 execute workflow-demo --remote --file=./db.sql
   ```
5. Deploy the workflow using Wrangler:
   ```bash
   npm run deploy
   ```
6. Save the deployment URL we'll need that setting up the Next.js frontend.
   
### Frontend Deployment

1. Clone this repository to your local machine
2. Navigate to the frontend directory:
   ```bash
   cd nextjs-workflow-frontend
   ```
3. Install dependencies:
   ```bash
   npm install
   ```
4. In your preferred editor open the `\nextjs-workflow-frontend\app\constants.ts` file and change the API_BASE_URL to the url of your deployed Workflow (No trailing `/` at the end).
   ```txt
      export const API_BASE_URL = '<your-workflow-url>';
   ```
4. Deploy to Cloudflare:
   ```bash
   npm run deploy
   ``` 

## Reference Architecture
![workflow-diagram](https://github.com/user-attachments/assets/ffee1de3-a5a0-4727-bae0-cfbc665da308)

## Learn More

* Read the [Workflows GA announcement blog](https://blog.cloudflare.com/workflows-ga-production-ready-durable-execution/) to understand the core concepts
* Review the [Workflows developer documentation](https://developers.cloudflare.com/workflows/) for detailed API reference and examples
* Check out the [waitForEvent API documentation](https://developers.cloudflare.com/workflows/apis/wait-for-event/) for specific details about implementing human-in-the-loop workflows
