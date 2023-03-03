import inquirer from "inquirer";
import * as dotenv from "dotenv";
import { ChatCompletionRequestMessage, Configuration, OpenAIApi } from "openai";
async function main() {
	//Setup OpenAI API

	const apiKey = process.env.OPENAI_API_KEY;
	if (!apiKey) {
		console.error("No API key found in .env file");
		return;
	}

	const configuration = new Configuration({ apiKey });
	const openai = new OpenAIApi(configuration);

	const defaultContext = "You are a useful polite assistant named Chat GPT";

	// init message history
	const messageHistory: ChatCompletionRequestMessage[] = [
		{ role: "system", content: defaultContext },
	];

	// ask if use default context

	const { useCustomContext } = await inquirer.prompt<{
		useCustomContext: boolean;
	}>({
		type: "confirm",
		name: "useCustomContext",
		message: "Want to give some custom context to Chat GPT?",
		default: false,
	});

	if (useCustomContext) {
		//Get context from user
		const { context } = await inquirer.prompt<{ context: string }>({
			type: "editor",
			name: "context",
			message: "Enter your context:",
			default: defaultContext,
		});
		messageHistory[0] = { role: "system", content: context };
	}

	console.log(`System: ${messageHistory[0].content}`);

	while (true) {
		const { message } = await inquirer.prompt<{ message: string }>({
			type: "input",
			name: "message",
			message: "You:",
		});
		messageHistory.push({ role: "user", content: message });
		const response = await openai.createChatCompletion({
			model: "gpt-3.5-turbo",
			messages: messageHistory,
		});

		const answer = response.data.choices[0].message?.content;
		//push the answer to the message history
		messageHistory.push({ role: "assistant", content: answer ?? "" });

		console.log(`Chat GPT: ${answer}`);
	}
}

dotenv.config();
main();
