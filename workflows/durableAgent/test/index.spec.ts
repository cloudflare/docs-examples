import { SELF } from 'cloudflare:test';
import { describe, it, expect, beforeEach } from 'vitest';
import { searchReposTool, getRepoTool } from '../worker/tools';
import type { StartWorkflowResponse } from '../worker/types';

describe('Durable AI Agent worker', () => {
	// Reset agent state before each test
	beforeEach(async () => {
		await SELF.fetch('https://example.com/api/reset', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({}),
		});
	});

	describe('API Endpoints - GET /api', () => {
		it('returns 400 for invalid API requests', async () => {
			const response = await SELF.fetch('https://example.com/api');
			expect(response.status).toBe(400);
			expect(await response.text()).toBe('Invalid API request');
		});

		it('returns workflow status for valid instanceId', async () => {
			// First create a workflow
			const createResponse = await SELF.fetch('https://example.com/api', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ task: 'Find popular TypeScript frameworks' }),
			});
			expect(createResponse.status).toBe(200);
			const createData = (await createResponse.json()) as StartWorkflowResponse;
			expect(createData).toHaveProperty('instanceId');

			// Then check its status
			const statusResponse = await SELF.fetch(`https://example.com/api?instanceId=${createData.instanceId}`);
			expect(statusResponse.status).toBe(200);
			const statusData = await statusResponse.json();
			expect(statusData).toHaveProperty('status');
		});
	});

	describe('API Endpoints - POST /api', () => {
		it('successfully creates a workflow with valid task', async () => {
			const response = await SELF.fetch('https://example.com/api', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ task: 'Find popular TypeScript frameworks' }),
			});

			expect(response.status).toBe(200);
			const data = (await response.json()) as StartWorkflowResponse;
			expect(data).toHaveProperty('instanceId');
			expect(typeof data.instanceId).toBe('string');
		});

		it('rejects workflow creation with missing task', async () => {
			const response = await SELF.fetch('https://example.com/api', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({}),
			});

			expect(response.status).toBe(400);
		});

		it('rejects workflow creation with empty task (Zod validation)', async () => {
			const response = await SELF.fetch('https://example.com/api', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ task: '' }),
			});

			expect(response.status).toBe(400);
			const text = await response.text();
			expect(text).toContain('Task must not be empty');
		});
	});

	describe('API Endpoints - POST /api/reset', () => {
		it('resets agent state without instanceId', async () => {
			const response = await SELF.fetch('https://example.com/api/reset', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({}),
			});

			expect(response.status).toBe(200);
			expect(await response.text()).toBe('OK');
		});

		it('resets agent state and terminates workflow with instanceId', async () => {
			// Create a workflow first
			const createResponse = await SELF.fetch('https://example.com/api', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ task: 'Find popular TypeScript frameworks' }),
			});
			const createData = (await createResponse.json()) as StartWorkflowResponse;

			// Reset with the instance ID
			const response = await SELF.fetch('https://example.com/api/reset', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ instanceId: createData.instanceId }),
			});

			expect(response.status).toBe(200);
			expect(await response.text()).toBe('OK');
		});
	});

	describe('Tool Functions', () => {
		describe('search_repos', () => {
			it('returns search results for valid query', async () => {
				const result = await searchReposTool.run({ query: 'typescript' });
				expect(result).toBeTruthy();
				expect(typeof result).toBe('string');

				// Parse result to verify structure
				const parsed = JSON.parse(result);
				expect(Array.isArray(parsed)).toBe(true);
				if (parsed.length > 0) {
					expect(parsed[0]).toHaveProperty('name');
					expect(parsed[0]).toHaveProperty('stars');
				}
			});
		});

		describe('get_repo', () => {
			it('returns repository details for valid repo', async () => {
				const result = await getRepoTool.run({ owner: 'cloudflare', repo: 'workers-sdk' });
				expect(result).toBeTruthy();
				expect(typeof result).toBe('string');

				// Parse result to verify structure
				const parsed = JSON.parse(result);
				expect(parsed).toHaveProperty('name');
				expect(parsed).toHaveProperty('description');
				expect(parsed).toHaveProperty('stars');
				expect(parsed).toHaveProperty('forks');
				expect(parsed).toHaveProperty('issues');
				expect(parsed).toHaveProperty('language');
				expect(parsed).toHaveProperty('license');
				expect(parsed).toHaveProperty('updated');
			});

			it('handles non-existent repository', async () => {
				const result = await getRepoTool.run({
					owner: 'nonexistentuser123',
					repo: 'nonexistentrepo456',
				});
				expect(result).toContain('Repo not found');
			});
		});
	});

	describe('WebSocket Endpoint', () => {
		it('returns 404 for non-websocket requests to /ws/agent', async () => {
			const response = await SELF.fetch('https://example.com/ws/agent/test');
			expect(response.status).toBe(404);
		});
	});

	describe('Edge Cases', () => {
		it('returns 404 for unknown routes', async () => {
			const response = await SELF.fetch('https://example.com/unknown');
			expect(response.status).toBe(404);
		});
	});
});
