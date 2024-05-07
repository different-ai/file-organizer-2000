import type { NextApiRequest, NextApiResponse } from "next";

import { generateObject } from "ai";
import { z } from "zod";
import { models } from "@/lib/models";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === "POST") {
    const { activeFileContent, files } = req.body;
    console.log(
      "using process.env.MODEL_RELATIONSHIPS",
      process.env.MODEL_RELATIONSHIPS
    );
    const model = models[process.env.MODEL_RELATIONSHIPS || "gpt-4-turbo"];

    const prompt = `Given the content of the active file:

${activeFileContent}

And the following files:

${files.map((file: { name: string }) => `File: ${file.name}\n`).join("\n\n")}

Which 5 files are the most similar to the active file based on their content? Respond with a list of the 1-5 most similar file names, one per line. If none are similar, respond with "none".`;

    const { object } = await generateObject({
      model,
      schema: z.object({
        similarFiles: z.array(z.string().nullable()),
      }),
      prompt: prompt,
    });
    console.log(object);

    res.status(200).json(object);
  } else {
    res.status(405).json({ message: "Method not allowed" });
  }
}
