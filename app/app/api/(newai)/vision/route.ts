import { NextResponse, NextRequest } from "next/server";
import { generateText } from "ai"; // Assuming generateText is the method from the AI SDK
import { getModel } from "@/lib/models";
import { generateMessages } from "./prompt";
import { handleAuthorization } from "@/lib/handleAuthorization";
import { incrementAndLogTokenUsage } from "@/lib/incrementAndLogTokenUsage";

export const maxDuration = 60; // This function can run for a maximum of 5 seconds

export async function POST(request: NextRequest) {
  try {
    const payload = await request.json();
    const { userId } = await handleAuthorization(request);

    const model = getModel(process.env.VISION_MODEL_NAME);
    const messages = generateMessages(model, payload.image);
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
    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status }
      );
    }
  }
}