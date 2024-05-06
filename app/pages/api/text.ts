import { NextApiResponse } from "next";
import { generateObject, generateText } from "ai";
import { models } from "@/lib/models";
import { z } from "zod";

export default async function POST(req: Request, res: NextApiResponse) {
  try {
    const { content, formattingInstruction } = await req.json();

    const model = models[process.env.TEXT_MODEL || "gpt-4-turbo"];

    const result = await generateObject({
      model,
      schema: z.object({
        fromattedText: z.string(),
      }),
      prompt: `Format the following text according to these instructions:
      ${formattingInstruction}
      Text to format:
      ${content}
      Respond with only the formatted text.`,
    });

    return Response.json({ message: result.object.fromattedText });
  } catch (error) {
    console.error(error);

    res.status(500).json({ message: "Error" });
  }
}
export const runtime = "edge";
