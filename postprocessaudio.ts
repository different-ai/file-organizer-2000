import fetch from "node-fetch";

async function usePostProcessing(content: string, apiKey: string) {
	const system_prompt =
		"You are a helpful assistant. Your task is to correct any spelling discrepancies in the transcribed text.";

	const data = {
		model: "gpt-4",
		temperature: 0,
		messages: [
			{
				role: "system",
				content: system_prompt,
			},
			{
				role: "user",
				content: content,
			},
		],
	};

	const response = await fetch("https://api.openai.com/v1/chat/completions", {
		method: "POST",
		body: JSON.stringify(data),
		headers: {
			"Content-Type": "application/json",
			Authorization: `Bearer ${apiKey}`,
		},
	});

	if (!response.ok) {
		console.error("Error:", response.status);
		return;
	}
	const result = await response.json();
	console.log(result);
	console.log(result.choices[0].message.content);
	return result.choices[0].message.content.trim();
}

export default usePostProcessing;
