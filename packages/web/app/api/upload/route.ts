import { NextRequest, NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { handleAuthorization } from "@/lib/handleAuthorization";
import { db, uploadedFiles } from "@/drizzle/schema";

const ALLOWED_FILE_TYPES = {
  "application/pdf": "pdf",
  "image/jpeg": "image",
  "image/png": "image",
  "image/webp": "image",
};

export async function POST(request: NextRequest) {
  try {
    const { userId } = await handleAuthorization(request);
    
    const formData = await request.formData();
    const file = formData.get("file") as File;
    
    if (!file) {
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      );
    }

    // Validate file type
    const fileType = ALLOWED_FILE_TYPES[file.type];
    if (!fileType) {
      return NextResponse.json(
        { error: "Unsupported file type" },
        { status: 400 }
      );
    }

    // Upload to Vercel Blob
    const blob = await put(`${userId}/${file.name}`, file, {
      access: "public",
    });

    // Create database record
    const [uploadedFile] = await db
      .insert(uploadedFiles)
      .values({
        userId,
        blobUrl: blob.url,
        fileType,
        originalName: file.name,
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