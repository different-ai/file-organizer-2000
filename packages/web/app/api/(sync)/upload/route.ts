import { NextRequest, NextResponse } from "next/server";
import { uploadFile } from "@/app/dashboard/sync/actions";
import { auth } from "@clerk/nextjs/server";

export const runtime = "nodejs"; // Use Node.js runtime

// Define the response type
type UploadResponse = {
  success: boolean;
  fileId?: number | string;
  status?: string;
  error?: string;
  retryable?: boolean;
};

export async function POST(request: NextRequest) {
  try {
    // Check authentication first
    const { userId } = await auth();
    const authHeader = request.headers.get("authorization");
    
    // Handle API key auth from mobile app
    if (!userId && authHeader) {
      const token = authHeader.replace("Bearer ", "");
      
      if (!token) {
        console.error("Unauthorized upload attempt - invalid token");
        return NextResponse.json<UploadResponse>(
          { success: false, error: "Unauthorized", retryable: false },
          { status: 401 }
        );
      }
      
      // Continue with the request for mobile app with token
      // Parse JSON body
      let fileData;
      try {
        fileData = await request.json();
        console.log("Received file data from mobile:", { 
          name: fileData.name, 
          type: fileData.type,
          base64Length: fileData.base64?.length 
        });
      } catch (error) {
        console.error("JSON parsing error:", error);
        return NextResponse.json<UploadResponse>(
          { success: false, error: "Invalid JSON format", retryable: false },
          { status: 400 }
        );
      }

      const { name, type, base64 } = fileData;

      if (!name || !type || !base64) {
        console.error("Missing required fields");
        return NextResponse.json<UploadResponse>(
          { success: false, error: "Missing required fields", retryable: true },
          { status: 400 }
        );
      }

      // Call uploadFile with the token for mobile authentication
      const result = await uploadFile({ name, type, base64 }, token);
      return NextResponse.json<UploadResponse>(result);
    } else if (!userId) {
      console.error("Unauthorized upload attempt - no userId or token");
      return NextResponse.json<UploadResponse>(
        { success: false, error: "Unauthorized", retryable: false },
        { status: 401 }
      );
    }

    // Regular web authentication flow
    // Parse JSON body
    let fileData;
    try {
      fileData = await request.json();
      console.log("Received file data:", { 
        name: fileData.name, 
        type: fileData.type,
        base64Length: fileData.base64?.length 
      });
    } catch (error) {
      console.error("JSON parsing error:", error);
      return NextResponse.json<UploadResponse>(
        { success: false, error: "Invalid JSON format", retryable: false },
        { status: 400 }
      );
    }

    const { name, type, base64 } = fileData;

    if (!name || !type || !base64) {
      console.error("Missing required fields");
      return NextResponse.json<UploadResponse>(
        { success: false, error: "Missing required fields", retryable: true },
        { status: 400 }
      );
    }

    const result = await uploadFile({ name, type, base64 });
    return NextResponse.json<UploadResponse>(result);
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json<UploadResponse>(
      { 
        success: false, 
        error: "Server error during upload", 
        retryable: true 
      },
      { status: 500 }
    );
  }
}