import { NextRequest, NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { auth } from "@clerk/nextjs/server";
import { db, uploadedFiles } from "@/drizzle/schema";

export const runtime = "nodejs"; // Use Node.js runtime

const ALLOWED_FILE_TYPES = {
  "application/pdf": "pdf",
  "image/jpeg": "image",
  "image/png": "image",
  "image/webp": "image",
};

// Add this type near the top of the file
type UploadResponse = {
  success: boolean;
  fileId?: string;
  status?: string;
  error?: string;
  retryable?: boolean;
};

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
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
      return NextResponse.json(
        { error: "Invalid JSON format" },
        { status: 400 }
      );
    }

    const { name: fileName, type: mimeType, base64 } = fileData;

    if (!fileName || !mimeType || !base64) {
      console.error("Missing required fields");
      return NextResponse.json<UploadResponse>(
        { success: false, error: "Missing required fields", retryable: true },
        { status: 400 }
      );
    }

    // Convert base64 to Blob
    const byteCharacters = Buffer.from(base64, 'base64');
    const blob = new Blob([byteCharacters], { type: mimeType });
    const fileObject = new File([blob], fileName, { type: mimeType });

    console.log("Created file object:", {
      name: fileObject.name,
      type: fileObject.type,
      size: fileObject.size
    });

    // Check if file type is supported
    const fileCategory = ALLOWED_FILE_TYPES[mimeType];
    if (!fileCategory) {
      return NextResponse.json<UploadResponse>(
        { success: false, error: "Unsupported file type", retryable: false },
        { status: 400 }
      );
    }

    // Upload to Vercel Blob
    const blobResult = await put(`${userId}/${fileName}`, fileObject, {
      access: "public",
    });

    // Create database record
    const [uploadedFile] = await db
      .insert(uploadedFiles)
      .values({
        userId,
        blobUrl: blobResult.url,
        fileType: fileCategory,
        originalName: fileName,
        status: "pending",
      })
      .returning();

    return NextResponse.json<UploadResponse>({
      success: true,
      fileId: uploadedFile.id,
      status: "pending"
    });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json<UploadResponse>(
      { 
        success: false, 
        error: "Failed to upload file", 
        retryable: true 
      },
      { status: 500 }
    );
  }
}