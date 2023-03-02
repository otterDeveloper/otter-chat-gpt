import inquirer from "inquirer";
async function main() {
	const { context } = await inquirer.prompt<{ context: string }>({
		type: "editor",
		name: "context",
		message: "Want to give context some context to Chat GPT?",
		default: "You are a useful polite assistant named Chat GPT",
	});
	console.log(context);
}

main();