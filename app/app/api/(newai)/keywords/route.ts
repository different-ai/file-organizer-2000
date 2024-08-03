import { NextResponse, NextRequest } from "next/server";

import { incrementAndLogTokenUsage } from "@/lib/incrementAndLogTokenUsage";
import { handleAuthorization } from "@/lib/handleAuthorization";
import { getModel } from "@/lib/models";


import { extractKeywords } from "../../../../aiService";

export async function POST(request: NextRequest) {
  try {
    const { userId } = await handleAuthorization(request);
    const { query } = await request.json();
    const model = getModel(process.env.MODEL_NAME);
    const keywordsData = await extractKeywords(query, model);
    const keyword = keywordsData.object.keyword;

    // Increment token usage
    const tokens = keywordsData.usage.totalTokens;
    console.log("incrementing token usage keywords", userId, tokens);
    await incrementAndLogTokenUsage(userId, tokens);

    return NextResponse.json({ keyword });
  } catch (error) {
    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status }
      );
    }
  }
}