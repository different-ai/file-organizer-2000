import { NextRequest, NextResponse } from "next/server";
import { getFileStatus } from "@/app/dashboard/sync/actions";
import { auth } from "@clerk/nextjs/server";

// Define the response type locally
type FileStatusResponse = {
  status: string;
  text: string | null;
  error: string | null;
};

export async function GET(request: NextRequest) {
  try {
    // Check authentication using Clerk
    const { userId } = await auth();
    
    // If no userId, user is not authenticated
    if (!userId) {
      console.error("Unauthorized status check attempt - no userId");
      return NextResponse.json(
        { error: "Unauthorized - authentication required" },
        { status: 401 }
      );
    }
    
    // Get fileId from request parameters
    const fileId = parseInt(request.nextUrl.searchParams.get("fileId") || "0", 10);

    if (!fileId) {
      return NextResponse.json(
        { error: "File ID is required" },
        { status: 400 }
      );
    }

    console.log(`Processing file status request for fileId: ${fileId} with userId: ${userId}`);
    
    // Pass the userId from Clerk to getFileStatus
    const result = await getFileStatus(fileId, userId);
    
    if (!result) {
      console.error(`Unexpected null result from getFileStatus for fileId: ${fileId}`);
      return NextResponse.json(
        { error: "Failed to retrieve file status" },
        { status: 500 }
      );
    }
    console.log(result);
    
    // and not null
    if ('error' in result && result.error !== null) {
      console.log(`Error in getFileStatus: ${result.error}`);
      return NextResponse.json(
        { error: result.error },
        { status: result.error === "Unauthorized" ? 401 : 
                result.error === "File not found" ? 404 : 500 }
      );
    }

    // Ensure proper response structure before sending
    const response = result as FileStatusResponse;
    
    // If the text field contains stringified JSON, try to parse it
    if (response.text && response.text.trim().startsWith('{') && response.text.trim().endsWith('}')) {
      try {
        // Parse the text field if it's a JSON string
        const parsedText = JSON.parse(response.text);
        response.text = parsedText;
      } catch (e) {
        // If parsing fails, leave as is - it might be valid text that just happens to start/end with curly braces
        console.log('Text field appears to be JSON but failed to parse:', e);
      }
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error("Status check error:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { 
        error: "Failed to check file status", 
        details: errorMessage
      },
      { status: 500 }
    );
  }
}