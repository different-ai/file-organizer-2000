import fs from "fs";
import OpenAI from "openai";

async function useAudio(filePath: string, apiKey): Promise<string> {
	const openai = new OpenAI({ apiKey, dangerouslyAllowBrowser: true });
	const transcription = await openai.audio.transcriptions.create({
		file: fs.createReadStream(filePath),
		model: "whisper-1",
	});

	return transcription.text;
}

export default useAudio;
