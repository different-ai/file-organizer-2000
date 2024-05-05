import type { NextApiRequest, NextApiResponse } from "next";
import { generateObject } from "ai";
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

    const prompt = `Given the text "${content}" (and if relevant ${fileName}), which of the following tags are the most relevant? ${tags.join(
      ", "
    )}`;

    const { object } = await generateObject({
      model,
      schema: z.object({
        mostSimilarTags: z.array(z.string()),
      }),
      prompt: prompt,
    });

    const normalizedTags = object.mostSimilarTags
      .map((tag: string) => (tag.startsWith("#") ? tag : `#${tag}`))
      .map((tag: string) => tag.trim())
      .filter((tag: string) => !content.includes(tag));

    res.status(200).json({ tags: normalizedTags });
  } else {
    res.status(405).json({ message: "Method not allowed" });
  }
}
