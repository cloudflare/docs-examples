import OpenAI from "openai";

export default {
	async fetch(request, env, ctx): Promise<Response> {
		const openai = new OpenAI({
			apiKey: env.OPENAI_API_KEY,
		});

		// Create a TransformStream to handle streaming data
		let { readable, writable } = new TransformStream();
		let writer = writable.getWriter();
		const textEncoder = new TextEncoder();

		ctx.waitUntil(
			(async () => {
				const stream = await openai.chat.completions.create({
					model: "gpt-4o-mini",
					messages: [{ role: "user", content: "Tell me a story" }],
					stream: true,
				});

				// loop over the data as it is streamed and write to the writeable
				for await (const part of stream) {
					writer.write(
						textEncoder.encode(part.choices[0]?.delta?.content || ""),
					);
				}
				writer.close();
			})(),
		);

		// Send the readable back to the browser
		return new Response(readable);
	},
} satisfies ExportedHandler<Env>;
