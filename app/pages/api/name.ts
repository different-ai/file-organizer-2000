import type { NextApiRequest, NextApiResponse } from "next";
import { generateObject } from "ai";
import { z } from "zod";
import { models } from "@/lib/models";

type ResponseData = {
  name?: string;
  message?: string;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData>
) {
  if (req.method === "POST") {
    try {
      const model = models[process.env.MODEL_NAME || "gpt-4-turbo"];

      // const model = openai("gpt-3.5-turbo");
      const { object } = await generateObject({
        model,
        schema: z.object({
          name: z.string(),
        }),
        prompt: `You are a helpful assistant. You only answer short (less than 30 chars titles). You do not use any special character just text. Use something very specific to the content not a generic title.

Give a title to this document:
${req.body.document}`,
      });

      res.status(200).json({ name: object.name });
    } catch (error) {
      console.error(error);
      if (error.response && error.response.status === 401) {
        console.log("Invalid OpenAI API key");
        res.status(401).json({ message: "Invalid API key" });
      } else {
        res.status(500).json({ message: "Error" });
      }
    }
  } else {
    res.status(405).json({ message: "Method not allowed" });
  }
}
