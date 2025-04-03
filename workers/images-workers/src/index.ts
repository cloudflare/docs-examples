export default {
	async fetch(request): Promise<Response> {
		// You can find this in the dashboard, it should look something like this: ZWd9g1K7eljCn_KDTu_MWA
		const accountHash = "";

		const { pathname } = new URL(request.url);

		// A request to something like cdn.example.com/83eb7b2-5392-4565-b69e-aff66acddd00/public
		// will fetch "https://imagedelivery.net/<accountHash>/83eb7b2-5392-4565-b69e-aff66acddd00/public"

		return fetch(`https://imagedelivery.net/${accountHash}${pathname}`);
	},
} satisfies ExportedHandler;
