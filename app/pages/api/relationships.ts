import type { NextApiRequest, NextApiResponse } from "next";
import { openai } from "@ai-sdk/openai";

import { generateObject } from "ai";
import { z } from "zod";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === "POST") {
    const { activeFileContent, files } = req.body;
    const model = openai("gpt-4-turbo");

    const prompt = `Given the content of the active file:

${activeFileContent}

And the following files:

${files.map((file: { name: string }) => `File: ${file.name}\n`).join("\n\n")}

Which 10 files are the most similar to the active file based on their content? Respond with a list of the 10 most similar file names, one per line.`;

    const { object } = await generateObject({
      model,
      schema: z.object({
        similarFiles: z.array(z.string()),
      }),
      prompt: prompt,
    });
    console.log(object);

    res.status(200).json(object);
  } else {
    res.status(405).json({ message: "Method not allowed" });
  }
}
