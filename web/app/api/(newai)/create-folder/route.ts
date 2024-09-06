import { createNewFolder } from "../../../../aiService";
import { NextResponse, NextRequest } from "next/server";
import { getModel } from "@/lib/models";
import { incrementAndLogTokenUsage } from "@/lib/incrementAndLogTokenUsage";
import { handleAuthorization } from "@/lib/handleAuthorization";

export async function POST(request: NextRequest) {
  try {
    const { userId } = await handleAuthorization(request);
    const { content, fileName, existingFolders } = await request.json();
    const model = getModel(process.env.MODEL_NAME);

    const newFolderData = await createNewFolder(
      content,
      fileName,
      existingFolders,
      model
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
