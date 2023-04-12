import inquirer from "inquirer";
import { ChatCompletionRequestMessage, Configuration, OpenAIApi } from "openai";
import { exec, spawn } from "node:child_process";

export async function terminalMode(apiKey: string) {
	const configuration = new Configuration({ apiKey });
	const openai = new OpenAIApi(configuration);

	const terminalContext =
		"You are an autonomous system connected to a Ubuntu 20.04 bash terminal, you must follow your instructions issued to you. You will transform natural language requests into bash commands. You must write the commands to execute surrounded by Markdown code blocks ```, the commands to execute will be parsed from your output using the following regex expression /```([sS]*?)```/. Don't ask the user for inputs, dont give user advice just execute. The terminal outputs will also be sorrounded by Markdown code blocks. Example: ```uname```. Dont spawn a new bash process, just execute the commands in the current bash process. Dont include new lines in the commands, this will be handled by a different system. Dont use the new line character in the commands.";

	const messageHistory: ChatCompletionRequestMessage[] = [
		{ role: "system", content: terminalContext },
	];

	const runner = spawn("bash");

	let bashOutput = "";

	runner.stdout.on("data", (data) => {
		console.log(`stdout: ${data.toString()}`);
		bashOutput += data.toString();
	});

	runner.stderr.on("data", (data) => {
		console.error(`stderr: ${data.toString()}`);
		bashOutput += data.toString();
	});
	console.log(`System: ${messageHistory[0].content}`);

	while (true) {
		const { message } = await inquirer.prompt<{ message: string }>({
			type: "input",
			name: "message",
			message: "You:",
		});
		messageHistory.push({ role: "user", content: "```" + bashOutput + "```" });
		bashOutput = "";
		messageHistory.push({ role: "user", content: message });
		const response = await openai.createChatCompletion({
			model: "gpt-3.5-turbo",
			messages: messageHistory,
		});

		const answer = response.data.choices[0].message?.content;
		//push the answer to the message history
		messageHistory.push({ role: "assistant", content: `${answer}` ?? "" });

		console.log(`Chat GPT: ${answer}`);

		// get the tex sorrounded by ```
		const strippedCommand = answer?.match(/```([\s\S]*?)```/)?.[1] ?? "";
		if (strippedCommand) {
			const { allowExecution } = await inquirer.prompt<{
				allowExecution: boolean;
			}>({
				type: "confirm",
				name: "allowExecution",
				message: `Do you want to execute this command: ${strippedCommand}`,
				default: false,
			});

			if (allowExecution) {
				console.log(`Executing: ${strippedCommand}\n`);
				messageHistory.push({
					role: "system",
					content: `Executing: \`\`\`${strippedCommand}\n\`\`\``,
				});
				runner.stdin.write(`${strippedCommand}\n`);
			} else {
				messageHistory.push({
					role: "system",
					content: "User denied execution",
				});
				console.log("System: User denied execution");
			}
		}
	}
}
