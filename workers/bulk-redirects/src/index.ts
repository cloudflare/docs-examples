export default {
	async fetch(request): Promise<Response> {
		const externalHostname = "examples.cloudflareworkers.com";

		const redirectMap = new Map([
			["/bulk1", "https://" + externalHostname + "/redirect2"],
			["/bulk2", "https://" + externalHostname + "/redirect3"],
			["/bulk3", "https://" + externalHostname + "/redirect4"],
			["/bulk4", "https://google.com"],
		]);

		const requestURL = new URL(request.url);
		const path = requestURL.pathname;
		const location = redirectMap.get(path);

		if (location) {
			return Response.redirect(location, 301);
		}
		// If request not in map, return the original request
		return fetch(request);
	},
}
