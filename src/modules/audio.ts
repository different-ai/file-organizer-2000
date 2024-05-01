import { requestUrl } from "obsidian";
import { logMessage } from "../../utils";
import { makeApiRequest } from "..";

// audio type of type base64
async function useAudio(audioFileBase64: string, { baseUrl, apiKey }) {
  const endpoint = "api/audio";
  const url = `${baseUrl}/${endpoint}`;
  try {
    const result = await makeApiRequest(() =>
    requestUrl({
      url: url,
      method: "POST",
      body: JSON.stringify({ file: audioFileBase64 }),
      headers: {
        Authorization: "Bearer " + apiKey,
        "Content-Type": "application/json",
      },
    })
  );
    const data = await result.json;
    logMessage(data.text);
    return data.text;
  } catch (error) {
    console.error("Error uploading audio file:", error);
  }
}

export default useAudio;
