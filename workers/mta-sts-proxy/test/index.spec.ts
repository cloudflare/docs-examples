import { env, createExecutionContext, waitOnExecutionContext } from "cloudflare:test";
import { afterEach, describe, expect, it, vi } from "vitest";
import worker from "../src/index";

describe("mta-sts-proxy", () => {
	afterEach(() => {
		vi.restoreAllMocks();
	});

	it("proxies the Cloudflare MTA-STS policy file", async () => {
		const policy = "version: STSv1\nmode: enforce\nmx: *.mx.cloudflare.net\nmax_age: 86400\n";
		const fetchSpy = vi
			.spyOn(globalThis, "fetch")
			.mockResolvedValue(new Response(policy));

		const request = new Request("https://mta-sts.example.com/.well-known/mta-sts.txt");
		const ctx = createExecutionContext();
		const response = await worker.fetch(request, env, ctx);
		await waitOnExecutionContext(ctx);

		expect(fetchSpy).toHaveBeenCalledWith(
			"https://mta-sts.mx.cloudflare.net/.well-known/mta-sts.txt",
		);
		expect(await response.text()).toBe(policy);
	});
});
