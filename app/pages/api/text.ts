import { NextApiResponse } from "next";
import { generateText } from "ai";
import { models } from "@/lib/models";

export default async function POST(req: Request, res: NextApiResponse) {
  try {
    const { content, formattingInstructions } = await req.json();

    const model = models[process.env.TEXT_MODEL || "gpt-4-turbo"];

    const result = await generateText({
      model,
      messages: [
        {
          role: "user",
          content: `Format ${content} to the following instructions: ${formattingInstructions}`,
        },
      ],
    });

    return Response.json({ message: result.text });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error" });
  }
}
export const runtime = "edge";
