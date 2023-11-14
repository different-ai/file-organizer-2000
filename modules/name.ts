async function useName(document, apiKey) {
	const data = {
		model: "gpt-3.5-turbo",
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
		console.error("Error:", response.status);
		return;
	}
	const result = await response.json();
	console.log(result);
	console.log(result.choices[0].message.content);
	return result.choices[0].message.content.trim();
}

export default useName;
