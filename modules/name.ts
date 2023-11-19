async function useName(document, apiKey) {
	const data = {
		model: "gpt-4-1106-preview",
		messages: [
			{
				role: "system",
				content:
					"You are a helpful assistant. You only answer short (less than 20 chars titles). You do not use any special character just text. I use jargon like boox and obsidian.",
			},
			{
				role: "user",
				content: "Give a title to this document: \n " + document,
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
		throw new Error("Error:", response.status);
	}
	const result = await response.json();
	console.log(result.choices[0].message.content);
	return result.choices[0].message.content.trim();
}

export default useName;
