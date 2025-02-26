import { NextRequest, NextResponse } from "next/server";
import { getFiles } from "@/app/dashboard/sync/actions";
import { auth } from "@clerk/nextjs/server";

// Define the response type locally to avoid importing from actions
type FilesResponse = {
  files: Array<{
    id: number;
    originalName: string;
    fileType: string;
    status: string;
    createdAt: Date;
    tokensUsed: number | null;
    error: string | null;
    textContent: string | null;
    blobUrl: string;
  }>;
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
};

export async function GET(request: NextRequest) {
  try {
    // Check authentication first
    const { userId } = await auth();
    const authHeader = request.headers.get("authorization");
    
    // Handle API key auth from mobile app
    if (!userId && authHeader) {
      const token = authHeader.replace("Bearer ", "");
      
      if (!token) {
        console.error("Unauthorized files list attempt - invalid token");
        return NextResponse.json(
          { error: "Unauthorized" },
          { status: 401 }
        );
      }
      
      // Continue with the request for mobile app with token
      const page = parseInt(request.nextUrl.searchParams.get("page") || "1", 10);
      const limit = parseInt(request.nextUrl.searchParams.get("limit") || "10", 10);
      
      // Pass the token to getFiles for mobile authentication
      const result = await getFiles({ page, limit }, token);
      
      if ('error' in result) {
        return NextResponse.json(
          { error: result.error },
          { status: result.error === "Unauthorized" ? 401 : 500 }
        );
      }

      return NextResponse.json(result as FilesResponse);
    } else if (!userId) {
      console.error("Unauthorized files list attempt - no userId or token");
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }
    
    // Regular web authentication flow
    const page = parseInt(request.nextUrl.searchParams.get("page") || "1", 10);
    const limit = parseInt(request.nextUrl.searchParams.get("limit") || "10", 10);
    
    const result = await getFiles({ page, limit });
    
    if ('error' in result) {
      return NextResponse.json(
        { error: result.error },
        { status: result.error === "Unauthorized" ? 401 : 500 }
      );
    }

    return NextResponse.json(result as FilesResponse);
  } catch (error) {
    console.error("List files error:", error);
    return NextResponse.json(
      { error: "Failed to list files" },
      { status: 500 }
    );
  }
}