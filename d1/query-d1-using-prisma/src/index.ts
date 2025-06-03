import { PrismaClient } from './generated/prisma/';
import { PrismaD1 } from '@prisma/adapter-d1';

export interface Env {
	DB: D1Database;
}

export default {
	async fetch(request, env, ctx): Promise<Response> {
		const adapter = new PrismaD1(env.DB);
		const prisma = new PrismaClient({ adapter });

		const users = await prisma.user.findMany();
		const result = JSON.stringify(users);
		return new Response(result);
	},
} satisfies ExportedHandler<Env>;
