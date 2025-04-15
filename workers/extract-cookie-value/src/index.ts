import { parse } from "cookie";
export default {
	async fetch(request): Promise<Response> {
		// The name of the cookie
		const COOKIE_NAME = "__uid";
		const cookie = parse(request.headers.get("Cookie") || "");
		if (cookie[COOKIE_NAME] != null) {
			// Respond with the cookie value
			return new Response(cookie[COOKIE_NAME]);
		}
		return new Response("No cookie with name: " + COOKIE_NAME);
	},
} satisfies ExportedHandler;
