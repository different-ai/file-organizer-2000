import { generateObject, generateText } from "ai";
import { z } from "zod";
import { models } from "@/lib/models";
import { NextResponse } from "next/server";
import { generatePrompt } from "./prompt";


export async function POST(request: Request) {
  try {
    const { document } = await request.json();
    const model = models[process.env.MODEL_NAME || "gpt-4-turbo"];
    if (!model) {
      throw new Error(`Model ${process.env.MODEL_NAME} not found`);
    }
    const prompt = generatePrompt(model, document);
    const name = await generateText({
      model,
      prompt: prompt,
    });

    return NextResponse.json({ name: name.text });
  } catch (error) {
    console.error(error);
    if (error.response && error.response.status === 401) {
      console.log("Invalid OpenAI API key");
      return NextResponse.json({ message: "Invalid API key" }, { status: 401 });
    } else {
      return NextResponse.json({ message: "Error" }, { status: 500 });
    }
  }
}