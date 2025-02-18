import { NextRequest, NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { handleAuthorization } from "@/lib/handleAuthorization";
import { db, uploadedFiles } from "@/drizzle/schema";

export const runtime = "nodejs"; // Use Node.js runtime

const ALLOWED_FILE_TYPES = {
  "application/pdf": "pdf",
  "image/jpeg": "image",
  "image/png": "image",
  "image/webp": "image",
};

// Helper function to infer MIME type from filename extension
function inferMimeType(fileName: string): string {
  const extension = fileName.split('.').pop()?.toLowerCase();
  if (extension === 'pdf') return 'application/pdf';
  if (extension === 'jpg' || extension === 'jpeg') return 'image/jpeg';
  if (extension === 'png') return 'image/png';
  if (extension === 'webp') return 'image/webp';
  return '';
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = await handleAuthorization(request);

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
      return NextResponse.json(
        { error: "Missing required fields" },
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
      return NextResponse.json(
        { error: "Unsupported file type" },
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

    return NextResponse.json({
      success: true,
      fileId: uploadedFile.id,
      status: "pending",
    });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: "Failed to upload file" },
      { status: 500 }
    );
  }
}