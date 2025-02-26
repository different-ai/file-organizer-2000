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
    // Check authentication using Clerk
    const { userId } = await auth();
    
    // If no userId, user is not authenticated
    if (!userId) {
      console.error("Unauthorized upload attempt - no userId");
      return NextResponse.json<UploadResponse>(
        { success: false, error: "Unauthorized", retryable: false },
        { status: 401 }
      );
    }
    
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

    console.log(`Processing upload request with userId: ${userId}`);
    
    // Call uploadFile with the userId from Clerk
    const result = await uploadFile({ name, type, base64 }, userId);
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