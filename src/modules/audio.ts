import { requestUrl } from "obsidian";
import { logMessage } from "../../utils";

// audio type of type base64
async function useAudio(audioFileBase64: string, { baseUrl }) {
  const endpoint = "api/audio";
  const url = `${baseUrl}/${endpoint}`;
  try {
    const result = await requestUrl({
      url: url,
      method: "POST",
      body: JSON.stringify({ file: audioFileBase64 }),
      headers: {
        "Content-Type": "application/json",
      },
    });
    const data = await result.json;
    logMessage(data.text);
    return data.text;
  } catch (error) {
    console.error("Error uploading audio file:", error);
  }
}

export default useAudio;
