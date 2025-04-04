# docs-examples

This repo holds examples that are used in the [Cloudflare docs](https://developers.cloudflare.com) (and it's accompanying [GitHub repo](https://github.com/cloudflare/cloudflare-docs)).

## When to use

Use this repository when you want to use our [GitHubCode](https://developers.cloudflare.com/style-guide/components/github-code/) component within the Cloudflare docs.

We choose to scope this component solely to repos within the `cloudflare` org for security reasons.

## How to use

For any examples related to a specific product, create a new, top-level folder for that product.

Make sure you have the following files in your Worker:

- `.gitignore`
- `package.json`
- `wrangler.jsonc`
- Everything under `src`
- `worker-configuration.d.ts`
- `tsconfig.json`
- `static/README` 

Also, you should make your Worker using `TypeScript`. We can always detype to use JavaScript.