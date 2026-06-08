// Proxies the Cloudflare Email Service MTA-STS policy file so it can be served
// from your own domain under the well-known URI, as required by RFC 8461.
//
// Deploy this Worker, then add a custom domain of `mta-sts.<your-domain>` so
// that `https://mta-sts.<your-domain>/.well-known/mta-sts.txt` resolves.
//
// Docs: https://developers.cloudflare.com/email-service/configuration/mta-sts/
const POLICY_URL = "https://mta-sts.mx.cloudflare.net/.well-known/mta-sts.txt";

export default {
	async fetch(request, env, ctx): Promise<Response> {
		return await fetch(POLICY_URL);
	},
} satisfies ExportedHandler<Env>;
