import { requestUrl } from "obsidian";
import { logMessage } from "../../utils";

async function predictMostSimilarFile(
  content: string,
  allMarkdownFilePaths: string[],
  { baseUrl, apiKey }
) {
  const endpoint = "api/files";
  const url = `${baseUrl}/${endpoint}`;

  const response = await requestUrl({
    url: url,
    method: "POST",
    body: JSON.stringify({
      document: content,
      filePaths: allMarkdownFilePaths,
    }),
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
  });
  const result = await response.json;
  logMessage(`Most similar file path: ${result.choices[0].message.content}`);
  return result.choices[0].message.content.trim();
}

export default predictMostSimilarFile;
