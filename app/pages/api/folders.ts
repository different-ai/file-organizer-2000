import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  console.log("folders");
  if (req.method === "POST") {
    const { content, fileName, folders } = req.body;

    const prompt = `Given the text content "${content}" (and if the file name "${fileName}"), which of the following folders would be the most appropriate location for the file? Available folders: ${folders.join(
      ", "
    )}`;

    const data = {
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content:
            "Please respond with the name of the most appropriate folder from the provided list. If none of the folders are suitable, respond with 'None'.",
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
    const mostSimilarFolder = result.choices[0].message.content.trim();

    res.status(200).json({ folder: mostSimilarFolder });
  } else {
    res.status(405).json({ message: "Method not allowed" });
  }
}
