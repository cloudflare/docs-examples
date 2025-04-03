export default {
	async fetch(request) {
		// someHost is set up to return JSON responses
		const someHost = "https://jsonplaceholder.typicode.com";
		const url1 = someHost + "/todos/1";
		const url2 = someHost + "/todos/2";

		const responses = await Promise.all([fetch(url1), fetch(url2)]);
		const results = await Promise.all(responses.map((r) => r.json()));

		const options = {
			headers: { "content-type": "application/json;charset=UTF-8" },
		};
		return new Response(JSON.stringify(results), options);
	},
} satisfies ExportedHandler;
