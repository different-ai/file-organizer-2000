import { requestUrl } from "obsidian";
import { logMessage } from "../../utils";

async function classifier(
  content: { name: string; content: string; classifications: any[] },
  { baseUrl, apiKey }
) {
  const data = {
    temperature: 0,
    messages: [
      {
        role: "system",
        content: "", // assigned server side
      },
      {
        role: "user",
        content: content,
      },
    ],
  };
  const endpoint = "api/classifier";
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

export default classifier;
