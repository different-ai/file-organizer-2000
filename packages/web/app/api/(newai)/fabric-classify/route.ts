import { NextResponse, NextRequest } from "next/server";
import { incrementAndLogTokenUsage } from "@/lib/incrementAndLogTokenUsage";
import { handleAuthorization } from "@/lib/handleAuthorization";
import { generateText } from "ai"
import { getModel } from "@/lib/models";





export const maxDuration = 60;

export async function POST(request: NextRequest) {
  try {
    const { userId } = await handleAuthorization(request);
    const { content, systemContent,  enableFabric } = await request.json();
    console.log("content", content);
    console.log("systemContent", systemContent);
    console.log("enableFabric", enableFabric);

    if (!enableFabric) {
      return NextResponse.json({ error: "Fabric not enabled." }, { status: 400 });
    }


    const model = getModel(process.env.MODEL_NAME || 'gpt-4o');

    const result = await generateText({
      model: model,
      system: systemContent,
      prompt: content 
    });
    incrementAndLogTokenUsage(userId,  result.usage.totalTokens);

    return NextResponse.json({ formattedContent: result.text }, { status: 200 });
  } catch (error) {
    console.error("Error in fabric-classify route:", error);
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}