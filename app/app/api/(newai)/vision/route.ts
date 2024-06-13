import { NextResponse, NextRequest } from "next/server";
import { generateText } from "ai"; // Assuming generateText is the method from the AI SDK
import { getModel } from "@/lib/models";
import { generateMessages } from "./prompt";
import { handleAuthorization } from "@/lib/handleAuthorization";
import { incrementAndLogTokenUsage } from "@/lib/incrementAndLogTokenUsage";
import { openai } from "@ai-sdk/openai";

export const maxDuration = 60; // This function can run for a maximum of 5 seconds

export async function POST(request: NextRequest) {
  try {
    const payload = await request.json();
    const { userId } = await handleAuthorization(request);

    const model = openai("gpt-4o");
    const messages = generateMessages("gpt-4o", payload.image);
    // Using the AI SDK's generateText method
    const response = await generateText({
      model,
      messages,
    });
    const tokens = response.usage.totalTokens;
    console.log("incrementing token usage vision", userId, tokens);
    await incrementAndLogTokenUsage(userId, tokens);

    return NextResponse.json({ text: response.text });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: "Error" }, { status: 500 });
  }
}
