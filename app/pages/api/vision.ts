import type { NextApiRequest, NextApiResponse } from "next";

type ResponseData = {
	message: string;
};

export default async function handler(
	req: NextApiRequest,
	res: NextApiResponse<ResponseData>
) {
	if (req.method === "OPTIONS") {
		// headers added to allow cross origin requests
		// Pre-flight request. Reply successfully:
		res.setHeader("Access-Control-Allow-Origin", "*");
		res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
		res.setHeader(
			"Access-Control-Allow-Headers",
			"Origin, X-Requested-With, Content-Type, Accept"
		);
		res.statusCode = 200;
		res.end();
		return;
	}

	res.setHeader("Access-Control-Allow-Origin", "*");
	res.setHeader(
		"Access-Control-Allow-Headers",
		"Origin, X-Requested-With, Content-Type, Accept"
	);
	try {
		const apiKey = process.env.OPENAI_API_KEY || "";
		const payload = req.body;
		console.log("payload text route", payload);

		const response = await fetch(
			"https://api.openai.com/v1/chat/completions",
			{
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${apiKey}`,
				},
				body: JSON.stringify(payload),
			}
		);

		if (!response.ok) {
			console.log(`Error: ${response.status}`);
			return res.status(response.status).json({
				message: `Server responded with status: ${response.status}`,
			});
		}

		if (response.status === 401) {
			console.log("Invalid API key");
			return res.status(401).json({ message: "Invalid API key" });
		}
		const result = await response.json();
		console.log("server result text.ts", result);
		res.status(200).json(result);
	} catch (error) {
		console.error(error);
		res.status(500).json({ message: "Error" });
	}
}
