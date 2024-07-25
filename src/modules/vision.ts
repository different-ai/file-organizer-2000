import { requestUrl } from "obsidian";
import { makeApiRequest } from "..";

const defaultPrompt = `Extract text from image. If there's a drawing, describe it. Respond with only the extracted text or description.`;
// useVision.js
async function useVision(
  encodedImage,
  systemPrompt = defaultPrompt,
  { baseUrl, apiKey }
) {
  const jsonPayload = { image: encodedImage };
  const endpoint = "api/vision";
  const sanitizedBaseUrl = baseUrl.endsWith("/")
    ? baseUrl.slice(0, -1)
    : baseUrl;
  const url = `${sanitizedBaseUrl}/${endpoint}`;

  const response = await makeApiRequest(() =>
    requestUrl({
      url: url,
      method: "POST",
      body: JSON.stringify(jsonPayload),
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
    })
  );
  const result = await response.json;

  // add empty line to the end of the response for better readability
  return result.text + "\n\n";
}

export default useVision;
