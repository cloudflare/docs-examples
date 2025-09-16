// pg 8.13.0 or later is recommended
import { Client } from "pg";

export interface Env {
  // If you set another name in the Wrangler config file as the value for 'binding',
  // replace "HYPERDRIVE" with the variable name you defined.
  HYPERDRIVE: Hyperdrive;
}

export default {
  async fetch(request, env, ctx): Promise<Response> {
    // Create a client using the pg driver (or any supported driver, ORM or query builder)
    // with the Hyperdrive credentials. These credentials are only accessible from your Worker.
    const sql = new Client({
      connectionString: env.HYPERDRIVE.connectionString,
    });

    try {
      // Connect to the database
      await sql.connect();

      // Sample query
      const results = await sql.query(`SELECT * FROM pg_tables`);

      // Clean up the client after the response is returned, before the Worker is killed
      ctx.waitUntil(sql.end());

      // Return result rows as JSON
      return Response.json(results.rows);
    } catch (e) {
      console.error(e);
      return Response.json(
        { error: e instanceof Error ? e.message : e },
        { status: 500 }
      );
    }
  },
} satisfies ExportedHandler<Env>;
