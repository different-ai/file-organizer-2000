import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  console.log("hitting tag");
  if (req.method === "POST") {
    const { content, fileName, tags } = req.body;

    const prompt = `Given the text "${content}" (and if relevant ${fileName}), which of the following tags are the most relevant? ${tags.join(
      ", "
    )}`;

    const data = {
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content:
            "Always answer with a list of tag names from the provided list. If none of the tags are relevant, answer with an empty list.",
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
    const mostSimilarTags = result.choices[0].message.content.trim();

    const normalizedTags = mostSimilarTags
      .replace(/[^a-zA-Z0-9# ]/g, "")
      .split(" ")
      .map((tag: string) => (tag.startsWith("#") ? tag : `#${tag}`))
      .map((tag: string) => tag.trim())
      .filter((tag: string) => !content.includes(tag));

    res.status(200).json({ tags: normalizedTags });
  } else {
    res.status(405).json({ message: "Method not allowed" });
  }
}
