import type { NextApiRequest, NextApiResponse } from "next";

import { generateObject } from "ai";
import { z } from "zod";
import { models } from "@/lib/models";

function generatePrompt(model: string, activeFileContent: string, files: { name: string }[]): string {
  switch (model) {
    case "gpt-4-turbo":
    default:
      return `Given the content of the active file:

${activeFileContent}

And the following files:

${files.map((file: { name: string }) => `File: ${file.name}\n`).join("\n\n")}

Which 5 files are the most similar to the active file based on their content? Respond with a list of the 1-5 most similar file names, one per line. If none are similar, respond with "none".`;
  }
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
    if (req.method === "POST") {
      const { activeFileContent, files } = req.body;
      const model = models[process.env.MODEL_RELATIONSHIPS || "gpt-4-turbo"];
      const prompt = generatePrompt(model, activeFileContent, files);
  
      const response = await generateObject({
        model,
        schema: z.array(z.string()),
        prompt,
      });
  
      const similarFiles = response.object;
      res.status(200).json({ similarFiles });
    } else {
      res.status(405).json({ message: "Method not allowed" });
    }
  }