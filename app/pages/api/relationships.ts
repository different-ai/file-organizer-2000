import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === "POST") {
    const { activeFileContent, files } = req.body;

    const prompt = `Given the content of the active file:
${activeFileContent}

And the following files:
${files.map((file) => `File: ${file.name}\n`).join("\n\n")}

Which 10 files are the most similar to the active file based on their content? Respond with a list of the 10 most similar file names, one per line.`;

    const data = {
      model: "gpt-4-turbo",
      messages: [
        {
          role: "system",
          content:
            "You are an AI assistant that helps find similar files based on their content.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
    };

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify(data),
    });

    const result = await response.json();
    const similarFiles = result.choices[0].message.content.trim().split("\n");

    res.status(200).json({ similarFiles });
  } else {
    res.status(405).json({ message: "Method not allowed" });
  }
}
