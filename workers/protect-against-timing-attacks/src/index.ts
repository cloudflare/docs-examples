interface Environment {
	MY_SECRET_VALUE?: string;
}

export default {
	async fetch(req: Request, env: Environment) {
		if (!env.MY_SECRET_VALUE) {
			return new Response("Missing secret binding", { status: 500 });
		}

		const authToken = req.headers.get("Authorization") || "";

		if (authToken.length !== env.MY_SECRET_VALUE.length) {
			return new Response("Unauthorized", { status: 401 });
		}

		const encoder = new TextEncoder();

		const a = encoder.encode(authToken);
		const b = encoder.encode(env.MY_SECRET_VALUE);

		if (a.byteLength !== b.byteLength) {
			return new Response("Unauthorized", { status: 401 });
		}

		if (!crypto.subtle.timingSafeEqual(a, b)) {
			return new Response("Unauthorized", { status: 401 });
		}

		return new Response("Welcome!");
	},
};
