import { NextResponse } from "next/server";
import {  generateText } from "ai"; // Assuming generateText is the method from the AI SDK
import { models } from "@/lib/models";
import { generateMessages } from "./prompt";

export async function POST(request: Request) {
  try {
    const payload = await request.json();

    const model = models[process.env.MODEL_VISION || "gpt-4-turbo"];
    const messages = generateMessages(model, payload.image);
    // Using the AI SDK's generateText method
    const response = await generateText({
      model,
      messages,
    });
    console.log("response text route", response);

    return NextResponse.json({ text: response.text });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: "Error" }, { status: 500 });
  }
}
