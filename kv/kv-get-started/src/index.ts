export interface Env {
  USERS_NOTIFICATION_CONFIG: KVNamespace;
}

export default {
  async fetch(request, env, ctx): Promise<Response> {
    try {
      await env.USERS_NOTIFICATION_CONFIG.put("user_2", "disabled");
      const value = await env.USERS_NOTIFICATION_CONFIG.get("user_2");
      if (value === null) {
        return new Response("Value not found", { status: 404 });
      }
      return new Response(value);
    } catch (err) {
      console.error(`KV returned error:`, err);
      const errorMessage =
        err instanceof Error
          ? err.message
          : "An unknown error occurred when accessing KV storage";
      return new Response(errorMessage, {
        status: 500,
        headers: { "Content-Type": "text/plain" },
      });
    }
  },
} satisfies ExportedHandler<Env>;
