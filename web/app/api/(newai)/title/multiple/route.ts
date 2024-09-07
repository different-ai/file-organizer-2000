import { generateMultipleDocumentTitles } from "../../../../../aiService";
import { NextResponse, NextRequest } from "next/server";
import { incrementAndLogTokenUsage } from "@/lib/incrementAndLogTokenUsage";
import { handleAuthorization } from "@/lib/handleAuthorization";
import { getModel } from "@/lib/models";

export async function POST(request: NextRequest) {
    try {
        const { userId } = await handleAuthorization(request);
        const { document, instructions, currentName } = await request.json();
        const model = getModel(process.env.MODEL_NAME);
        const generateTitlesData = await generateMultipleDocumentTitles(
            document,
            currentName,
            model,
            instructions
        );
        const titles = generateTitlesData.object.names;

        const tokens = generateTitlesData.usage.totalTokens;
        console.log("incrementing token usage titles", userId, tokens);
        await incrementAndLogTokenUsage(userId, tokens);

        const response = NextResponse.json({ titles });
        response.headers.set("Access-Control-Allow-Origin", "*");

        return response;
    } catch (error) {
        if (error) {
            return NextResponse.json(
                { error: error.message },
                { status: error.status }
            );
        }
    }
}