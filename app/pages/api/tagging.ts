import type { NextApiRequest, NextApiResponse } from "next";
import { generateObject, generateText } from "ai";
import { z } from "zod";
import { models } from "@/lib/models";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  console.log("hitting tag");
  if (req.method === "POST") {
    const { content, fileName, tags } = req.body;

    const model = models[process.env.MODEL_TAGGING || "gpt-4-turbo"];

    const prompt = `Given the text "${content}" (and if relevant ${fileName}), which of the following tags are the most relevant?  
    Only answer tags and seperate with commas. ${tags.join(", ")}`;

    const object = generateText({
      model,
      prompt,
      system:
        "you always answer a list of tags that exist seperate them with commas. only answer tags nothing else",
    });

    const normalizedTags = (await object).text
      .split(",")
      .map((tag: string) => tag.replace("#", "").trim())
      .filter((tag: string) => !content.includes(tag));

    res.status(200).json({ tags: normalizedTags });
  } else {
    res.status(405).json({ message: "Method not allowed" });
  }
}
