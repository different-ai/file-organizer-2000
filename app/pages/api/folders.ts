import type { NextApiRequest, NextApiResponse } from "next";
import { generateObject } from "ai";
import { z } from "zod";
import { models } from "@/lib/models";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  console.log("folders");
  if (req.method === "POST") {
    const { content, fileName, folders } = req.body;
    const model = models[process.env.MODEL_FOLDERS || "gpt-4-turbo"];

    const prompt = `Given the text content "${content}" (and if the file name "${fileName}"), which of the following folders would be the most appropriate location for the file? Available folders: ${folders.join(
      ", "
    )}, if none of the folders are appropriate, respond with "None".`;

    const { object } = await generateObject({
      model,
      schema: z.object({
        mostSimilarFolder: z.string(),
      }),
      prompt: prompt,
    });

    const sanitizedFolderName = object.mostSimilarFolder.replace(
      /[\\:*?"<>|]/g,
      ""
    );

    res.status(200).json({ folder: sanitizedFolderName });
  } else {
    res.status(405).json({ message: "Method not allowed" });
  }
}
