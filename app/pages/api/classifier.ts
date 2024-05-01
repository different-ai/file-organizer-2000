import type { NextApiRequest, NextApiResponse } from "next";
type ResponseData = {
  message: string;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData>
) {
  try {
    const apiKey = process.env.OPENAI_API_KEY || "";

    const model = "gpt-4-turbo";

    let promptData = req.body.messages[1].content;
    const name = promptData.name;
    const content = promptData.content;
    const classifications = promptData.classifications;
    const fullPrompt = `Name: ${name}
    Content:
    ${content}
    classifications:${classifications.map((c) => c.type).join(", ")}
  Which of the following classifications would 
    be the most appropriate for the given content?`;

    // replace the content with the fullPrompt
    req.body.messages[1].content = fullPrompt;

    const systemPrompt =
      "Please respond with the name of the most appropriate classification from the provided list. If none of the classifications are suitable, respond with 'None'.";
    // replace the content with systemPrompt
    req.body.messages[0].content = systemPrompt;
    const data = {
      ...req.body,
      model,
    };
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      body: JSON.stringify(data),
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
    });

    if (!response.ok) {
      console.log(`Error: ${response.status}`);
      return res.status(response.status).json({
        message: `Server responded with status: ${response.status}`,
      });
    }

    const result = await response.json();
    res.status(200).json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error" });
  }
}
