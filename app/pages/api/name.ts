import type { NextApiRequest, NextApiResponse } from "next";

type ResponseData = {
	message: string;
};

export default async function handler(
	req: NextApiRequest,
	res: NextApiResponse<ResponseData>
) {
	try {
		const apiKey = process.env.OPENAI_API_KEY || "";
		if (!apiKey) {
			console.log("API key is missing");
		}
		// add check if api key is invalid

		const data = req.body;
		console.log("data", data);
		const response = await fetch(
			"https://api.openai.com/v1/chat/completions",
			{
				method: "POST",
				body: JSON.stringify({
					model: data.model,
					messages: data.messages,
				}),
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${apiKey}`,
				},
			}
		);
		// if api key is invalid, response will be 401
		if (response.status === 401) {
			console.log("Invalid API key");
			return res.status(401).json({ message: "Invalid API key" });
		}
		const result = await response.json();
		res.status(200).json(result);
	} catch (error) {
		console.error(error);
		res.status(500).json({ message: "Error" });
	}
}
