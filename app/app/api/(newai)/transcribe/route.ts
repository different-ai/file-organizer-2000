import { NextResponse, NextRequest } from "next/server";
import { generateTranscriptFromAudio } from "../../../../aiService";
import { incrementAndLogTokenUsage } from "@/lib/incrementAndLogTokenUsage";
import { handleAuthorization } from "@/lib/handleAuthorization";

export async function POST(request: NextRequest) {
  const { userId } = await handleAuthorization(request);
  const { audio } = await request.json();

  try {
    const transcript = await generateTranscriptFromAudio(
      audio,
      process.env.OPENAI_API_KEY as string
    );

    // Estimate the token usage (you can adjust this based on your needs)
    const estimatedTokens = transcript.length / 4;
    await incrementAndLogTokenUsage(userId, estimatedTokens);

    return NextResponse.json({ transcript });
  } catch (error) {
    console.error("Error generating transcript:", error);
    return NextResponse.json(
      { message: "Error generating transcript" },
      { status: 500 }
    );
  }
}
