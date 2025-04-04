export interface Env {
	BINDING_NAME: KVNamespace;
  }

  export default {
	async fetch(request, env, ctx): Promise<Response> {
	  try {
		await env.BINDING_NAME.put("isCloudflareAwesome", "Yes");
		const value = await env.BINDING_NAME.get("isCloudflareAwesome");
		if (value === null) {
		  return new Response("Value not found", { status: 404 });
		}
		return new Response(value);
	  } catch (err) {
		// In a production application, you could instead choose to retry your KV
		// read or fall back to a default code path.
		console.error(`KV returned error: ${err}`);
		return new Response(err, { status: 500 });
	  }
	},
  } satisfies ExportedHandler<Env>;
