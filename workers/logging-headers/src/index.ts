export default {
	async fetch(request): Promise<Response> {
		console.log(new Map(request.headers));
		return new Response("Hello world");
	},
} satisfies ExportedHandler;
