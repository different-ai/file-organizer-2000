// pages/api/audio.ts
import { NextApiRequest, NextApiResponse } from "next";
import fs from "fs";
import OpenAI from "openai";

export const config = {
	// increase max size
	api: {
		bodyParser: {
			sizeLimit: "20mb",
		},
	},
};

export default async function handler(
	req: NextApiRequest,
	res: NextApiResponse
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
	const filePath = req.body.filePath;
	const apiKey = process.env.OPENAI_API_KEY;

	const openai = new OpenAI({ apiKey, dangerouslyAllowBrowser: true });
	const transcription = await openai.audio.transcriptions.create({
		file: fs.createReadStream(filePath),
		model: "whisper-1",
	});

	res.status(200).json({ text: transcription.text });
}
