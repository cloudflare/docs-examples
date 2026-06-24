# MTA-STS proxy

A Cloudflare Worker that proxies the Cloudflare Email Service [MTA-STS](https://datatracker.ietf.org/doc/html/rfc8461) policy file so it can be served from your own domain under the well-known URI:

```
https://mta-sts.<your-domain>/.well-known/mta-sts.txt
```

The Worker fetches `https://mta-sts.mx.cloudflare.net/.well-known/mta-sts.txt` and returns it unchanged.

## Usage

1. Deploy the Worker (use the **Deploy to Cloudflare** button in the docs, or run `npm run deploy`).
2. Add a custom domain of `mta-sts.<your-domain>` under **Settings** > **Domains & Routes**.
3. Confirm the policy is served:

   ```sh
   curl https://mta-sts.<your-domain>/.well-known/mta-sts.txt
   ```

For the full setup — including the `_mta-sts` DNS record and testing before enforcing — refer to [Configure MTA-STS](https://developers.cloudflare.com/email-service/configuration/mta-sts/).
