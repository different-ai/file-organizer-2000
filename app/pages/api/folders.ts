import type { NextApiRequest, NextApiResponse } from "next";
import {  generateText } from "ai";
import { models } from "@/lib/models";

function generatePrompt(model: string, content: string, fileName: string, folders: string[]): string {
  switch (model) {
    case "gpt-4-turbo":
    default:
      return `Given the text content "${content}" (and if the file name "${fileName}"), which of the following folders would be the most appropriate location for the file? Available folders: ${folders.join(
        ", "
      )}, if none of the folders are appropriate, respond with "None". Only answer with folder path.`;
  }
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  console.log("folders");
  if (req.method === "POST") {
    const { content, fileName, folders } = req.body;
    const model = models[process.env.MODEL_FOLDERS || "gpt-4-turbo"];

    const prompt = generatePrompt(model, content, fileName, folders);

    const { text } = await generateText({
      model,
      prompt: prompt,
      system:
        "you always answer a folder that exists in the list of folders.just the folder path. if none are appropriate respond with None only answer the folder path nothing else. e.g. /Private or /Blog/Ideas",
    });

    const sanitizedFolderName = text.replace(/[\\:*?"<>|]/g, "");

    res.status(200).json({ folder: sanitizedFolderName });
  } else {
    res.status(405).json({ message: "Method not allowed" });
  }
}