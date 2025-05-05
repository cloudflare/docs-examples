// Postgres.js 3.4.5 or later is recommended
import postgres from 'postgres';

export interface Env {
	// If you set another name in the Wrangler config file as the value for 'binding',
	// replace "HYPERDRIVE" with the variable name you defined.
	HYPERDRIVE: Hyperdrive;
}

export default {
	async fetch(request, env, ctx): Promise<Response> {
		// Create a connection using the Postgres.js driver (or any supported driver, ORM or query builder)
		// with the Hyperdrive credentials. These credentials are only accessible from your Worker.
		const sql = postgres(env.HYPERDRIVE.connectionString, {
			// Workers limit the number of concurrent external connections, so be sure to limit
			// the size of the local connection pool that postgres.js may establish.
			max: 5,

			// If you are not using array types in your Postgres schema,
			// disabling this will save you an extra round-trip every time you connect.
			fetch_types: false,
		});

		try {
			// Sample query
			const results = await sql`SELECT * FROM pg_tables`;

			// Clean up the client after the response is returned, before the Worker is killed
			ctx.waitUntil(sql.end());

			// Return result rows as JSON
			return Response.json(results);
		} catch (e) {
			console.error(e);
			return Response.json({ error: e instanceof Error ? e.message : e }, { status: 500 });
		}
	},
} satisfies ExportedHandler<Env>;
