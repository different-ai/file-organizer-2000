import fetch from "node-fetch";
import FormData from "form-data";
import fs from "fs";
import { promisify } from "util";
import { Transform, pipeline } from "stream";

const pipelinePromise = promisify(pipeline);

async function useAudio(filePath: string, apiKey: string): Promise<string> {
	const form = new FormData();
	console.log(form);
	form.append("file", fs.createReadStream(filePath));
	console.log(filePath);
	form.append("model", "whisper-1");
	form.append("response_format", "text");

	const response = await fetch(
		"https://api.openai.com/v1/audio/transcriptions",
		{
			method: "POST",
			body: form,
			headers: {
				Authorization: `Bearer ${apiKey}`,
				...form.getHeaders(),
			},
		}
	);

	if (!response.ok) {
		throw new Error(`HTTP error! status: ${response.status}`);
	}

	let data = "";
	if (response.body) {
		await pipelinePromise(
			response.body,
			// This will convert the stream into a string
			new Transform({
				transform(chunk, encoding, callback) {
					data += chunk.toString();
					callback();
				},
			})
		);
	}
	return data;
}

export default useAudio;
