import { requestUrl } from "obsidian";
import { logMessage } from "../../utils";

async function useName(document, { baseUrl, apiKey }) {
  const data = {
    model: "gpt-3.5-turbo",
    messages: [
      {
        role: "system",
        content:
          "You are a helpful assistant. You only answer short (less than 30 chars titles). You do not use any special character just text. Use something very specific to the content not a generic title.",
      },
      {
        role: "user",
        content: "Give a title to this document: \n " + document,
      },
    ],
  };
  logMessage("Using gpt-3.5-turbo-0125");
  const endpoint = "api/name";
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

export default useName;
