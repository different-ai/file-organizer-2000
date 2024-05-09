import { generateObject } from "ai";
import { z } from "zod";
import { models } from "@/lib/models";
import { NextResponse } from "next/server";
import { generatePrompt } from "./prompt";


export async function POST(request: Request) {
  const { activeFileContent, files } = await request.json();
  const model = models[process.env.MODEL_RELATIONSHIPS || "gpt-4-turbo"];
  const prompt = generatePrompt(model, activeFileContent, files);

  const response = await generateObject({
    model,
    schema: z.array(z.string()),
    prompt,
  });

  const similarFiles = response.object;
  return NextResponse.json({ similarFiles });
}