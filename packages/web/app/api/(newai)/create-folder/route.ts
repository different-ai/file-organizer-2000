import { createNewFolder } from "../aiService";
import { NextResponse, NextRequest } from "next/server";
import { getModel } from "@/lib/models";
import { ollama } from "ollama-ai-provider";
import { incrementAndLogTokenUsage } from "@/lib/incrementAndLogTokenUsage";
import { handleAuthorization } from "@/lib/handleAuthorization";

export async function POST(request: NextRequest) {
  try {
    const { userId } = await handleAuthorization(request);
    const { content, fileName, existingFolders, model = process.env.MODEL_NAME } = await request.json();
    const modelProvider = model === 'ollama-deepseek-r1' ? ollama("deepseek-r1") : getModel(model);

    const newFolderData = await createNewFolder(
      content,
      fileName,
      existingFolders,
      modelProvider
    );
    // increment tokenUsage
    const tokens = newFolderData.usage.totalTokens;
    console.log("incrementing token usage create folders", userId, tokens);
    await incrementAndLogTokenUsage(userId, tokens);
    const newFolderName = newFolderData.object.newFolderName;
    const response = NextResponse.json({ folderName: newFolderName });
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
