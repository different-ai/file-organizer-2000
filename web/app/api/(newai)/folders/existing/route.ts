import { NextRequest, NextResponse } from "next/server";
import { handleAuthorization } from "@/lib/handleAuthorization";
import { incrementAndLogTokenUsage } from "@/lib/incrementAndLogTokenUsage";
import { getModel } from "@/lib/models";
import { generateObject } from "ai";
import { z } from "zod";

export async function POST(request: NextRequest) {
    try {
        const { userId } = await handleAuthorization(request);
        const { content, fileName, folders } = await request.json();
        const model = getModel(process.env.MODEL_NAME);
        const sanitizedFileName = fileName.split('/').pop();
        const response = await generateObject({
            model,
            schema: z.object({
                suggestedFolders: z.array(z.string()).max(2)
            }),
            prompt: `Given the content: "${content}" and the file name: "${sanitizedFileName}", suggest up to 2 relevant folders from the following list: ${folders.join(
                ", "
            )}`,

        });
        const suggestedFolders = response.object.suggestedFolders;
        // increment tokenUsage
        const tokens = response.usage.totalTokens;
        console.log("incrementing token usage folders/existing", userId, tokens);
        await incrementAndLogTokenUsage(userId, tokens);
        return NextResponse.json({
            folders: suggestedFolders,
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