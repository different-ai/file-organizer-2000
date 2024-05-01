import { requestUrl } from "obsidian";
import { makeApiRequest } from "..";

const defaultPrompt = `Extract text from image. Write in markdown. If there's a drawing, describe it.`;
// useVision.js
async function useVision(
  encodedImage,
  systemPrompt = defaultPrompt,
  { baseUrl, apiKey }
) {
  const jsonPayload = {
    max_tokens: 800,
    messages: [
      {
        role: "user",
        content: [
          {
            type: "text",
            text: systemPrompt,
          },
          {
            type: "image_url",
            image_url: {
              url: `data:image/jpeg;base64,${encodedImage}`,
            },
          },
        ],
      },
    ],
  };
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

  return result.choices[0].message.content;
}

export default useVision;
