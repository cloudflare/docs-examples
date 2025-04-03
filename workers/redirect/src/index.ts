export default {
	async fetch(request): Promise<Response> {
		const destinationURL = "https://example.com";
		const statusCode = 301;
		return Response.redirect(destinationURL, statusCode);
	},
} satisfies ExportedHandler;
