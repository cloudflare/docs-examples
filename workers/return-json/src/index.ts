export default {
	async fetch(request): Promise<Response> {
		const data = {
			hello: "world",
		};

		return Response.json(data);
	},
} satisfies ExportedHandler;
