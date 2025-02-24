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
  // print authorization header
  console.log("authorization header", request.headers.get("authorization"));
  try {
    // Check authentication first - support both Clerk auth and API token
    console.log("getFileStatus");
    const { userId } = await auth();
    console.log("userId", userId);
    const authHeader = request.headers.get("authorization");
    
    // Handle API key auth from mobile app
    if (!userId && authHeader) {
      const token = authHeader.replace("Bearer ", "");
      
      // Skip user check for mobile requests if we have a token
      if (token) {
        // Continue with the request
        const fileId = parseInt(request.nextUrl.searchParams.get("fileId") || "0", 10);

        if (!fileId) {
          return NextResponse.json(
            { error: "File ID is required" },
            { status: 400 }
          );
        }

        console.log(`Processing mobile request for fileId: ${fileId} with token`);
        
        // Pass the token to getFileStatus for mobile authentication
        const result = await getFileStatus(fileId, token);
        
        if ('error' in result) {
          console.log(`Error in getFileStatus: ${result.error}`);
          return NextResponse.json(
            { error: result.error },
            { status: result.error === "Unauthorized" ? 401 : 
                    result.error === "File not found" ? 404 : 500 }
          );
        }

        return NextResponse.json(result as FileStatusResponse);
      } else {
        console.error("Unauthorized status check attempt - invalid token");
        return NextResponse.json(
          { error: "Unauthorized - invalid token" },
          { status: 401 }
        );
      }
    } else if (!userId) {
      console.error("Unauthorized status check attempt - no userId or token");
      return NextResponse.json(
        { error: "Unauthorized - authentication required" },
        { status: 401 }
      );
    }
    
    // Handle web app authentication with Clerk userId
    const fileId = parseInt(request.nextUrl.searchParams.get("fileId") || "0", 10);

    if (!fileId) {
      return NextResponse.json(
        { error: "File ID is required" },
        { status: 400 }
      );
    }

    const result = await getFileStatus(fileId);
    
    if ('error' in result) {
      console.log(`Error in getFileStatus with userId ${userId}: ${result.error}`);
      return NextResponse.json(
        { error: result.error },
        { status: result.error === "Unauthorized" ? 401 : 
                result.error === "File not found" ? 404 : 500 }
      );
    }

    return NextResponse.json(result as FileStatusResponse);
  } catch (error) {
    console.error("Status check error:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { 
        error: "Failed to check file status", 
        details: errorMessage,
        stack: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}