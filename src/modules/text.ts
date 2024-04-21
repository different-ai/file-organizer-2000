import { requestUrl } from "obsidian";
import { logMessage } from "../../utils";

async function generateText(
  content: string,
  systemPrompt: string,
  { baseUrl, apiKey }
) {
  const data = {
    temperature: 0,
    messages: [
      {
        role: "system",
        content: systemPrompt,
      },
      {
        role: "user",
        content: content,
      },
    ],
  };
  const endpoint = "api/text";
  const url = `${baseUrl}/${endpoint}`;

  const response = await requestUrl({
    url: url,
    method: "POST",
    body: JSON.stringify(data),
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
  });
  const result = await response.json;
  logMessage(result);
  logMessage(result.choices[0].message.content);
  return result.choices[0].message.content.trim();
}

export default generateText;
