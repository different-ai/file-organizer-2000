const defaultPrompt = `Extract text from image. Write in markdown. If there's a drawing, describe it.`;
// useVision.js
async function useVision(encodedImage, systemPrompt = defaultPrompt) {
	const jsonPayload = {
		model: "gpt-4-vision-preview",
		max_tokens: 800,
		messages: [
			{
				role: "user",
				content: [
					{
						type: "text",
						text: systemPrompt,
					},
					{
						type: "image_url",
						image_url: {
							url: `data:image/jpeg;base64,${encodedImage}`,
						},
					},
				],
			},
		],
	};

	const response = await fetch("http://localhost:3000/api/vision", {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify(jsonPayload),
	});

	if (!response.ok) {
		if (response.status === 402) {
			throw new Error("You have no credits left.");
		}
		if (response.status === 429) {
			throw new Error("You have exceeded the rate limit.");
		}
		if (response.status === 404) {
			throw new Error(
				"Model not found. It looks like you don't have access to GPT Vision."
			);
		}
		if (response.status === 500) {
			throw new Error("OpenAI Internal server error.");
		}
	}

	const result = await response.json();

	return result.choices[0].message.content;
}

export default useVision;
