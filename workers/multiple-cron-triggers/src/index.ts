interface Env {}
export default {
	async scheduled(
		controller: ScheduledController,
		env: Env,
		ctx: ExecutionContext,
	) {
		// Write code for updating your API
		switch (controller.cron) {
			case "*/3 * * * *":
				// Every three minutes
				await updateAPI();
				break;
			case "*/10 * * * *":
				// Every ten minutes
				await updateAPI2();
				break;
			case "*/45 * * * *":
				// Every forty-five minutes
				await updateAPI3();
				break;
		}
		console.log("cron processed");
	},
};
