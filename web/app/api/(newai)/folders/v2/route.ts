import { guessRelevantFoldersV2 } from "../../../../../aiService";
import { NextRequest, NextResponse } from "next/server";
import { handleAuthorization } from "@/lib/handleAuthorization";
import { incrementAndLogTokenUsage } from "@/lib/incrementAndLogTokenUsage";
import { getModel } from "@/lib/models";

export async function POST(request: NextRequest) {
    try {
        const { userId } = await handleAuthorization(request);
        const { content, fileName, folders, requestCount } = await request.json();
        const model = getModel(process.env.MODEL_NAME);
        const response = await guessRelevantFoldersV2(
            content,
            fileName,
            folders,
            requestCount,
            model
        );
        // increment tokenUsage
        const tokens = response.usage.totalTokens;
        console.log("incrementing token usage folders/existing", userId, tokens);
        await incrementAndLogTokenUsage(userId, tokens);
        return NextResponse.json({
            folders: response.object.suggestedFolders,
        });
    } catch (error) {
        if (error) {
            return NextResponse.json(
                { error: error.message },
                { status: error.status }
            );
        }
    }
}