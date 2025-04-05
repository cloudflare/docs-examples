export default {
	async fetch(req): Promise<Response> {
		const data =
			req.cf !== undefined
				? req.cf
				: { error: "The `cf` object is not available inside the preview." };

		return new Response(JSON.stringify(data, null, 2), {
			headers: {
				"content-type": "application/json;charset=UTF-8",
			},
		});
	},
} satisfies ExportedHandler;
