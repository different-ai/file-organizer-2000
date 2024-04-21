import { requestUrl } from "obsidian";
import { logMessage } from "../../utils";

async function predictTags(content: string, tags: string, { baseUrl, apiKey }) {
  const data = {
    document: content,
    tags: tags,
  };
  const endpoint = "api/tags";
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
  logMessage(result.choices[0].message.content);
  return result.choices[0].message.content.trim();
}

export default predictTags;
