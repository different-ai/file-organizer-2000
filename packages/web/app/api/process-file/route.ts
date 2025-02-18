import { NextRequest, NextResponse } from "next/server";
import { handleAuthorization } from "@/lib/handleAuthorization";
import { db, uploadedFiles } from "@/drizzle/schema";
import { eq } from "drizzle-orm";
import { del, list } from "@vercel/blob";
import { generateObject } from "ai";
import { getModel } from "@/lib/models";
import { incrementAndLogTokenUsage } from "@/lib/incrementAndLogTokenUsage";
import { z } from "zod";

type FileContent = 
  | { type: "file"; data: Buffer; mimeType: "application/pdf" }
  | { type: "image"; image: string };

export const maxDuration = 300; // 5 minutes

export async function POST(request: NextRequest) {
  let fileId: number | null = null;
  
  try {
    const { userId } = await handleAuthorization(request);
    const payload = await request.json();
    fileId = payload.fileId;

    // Get file record
    const [file] = await db
      .select()
      .from(uploadedFiles)
      .where(eq(uploadedFiles.id, fileId))
      .limit(1);

    if (!file) {
      return NextResponse.json(
        { error: "File not found" },
        { status: 404 }
      );
    }

    if (file.userId !== userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Update status to processing
    await db
      .update(uploadedFiles)
      .set({ status: "processing" })
      .where(eq(uploadedFiles.id, fileId));

    // Get file from Blob storage
    const response = await fetch(file.blobUrl);
    if (!response.ok) {
      throw new Error("Failed to fetch file from storage");
    }
    const arrayBuffer = await response.arrayBuffer();

    // Prepare file content based on type
    const fileContent: FileContent = file.fileType === 'pdf' ? 
      {
        type: "file",
        data: Buffer.from(arrayBuffer),
        mimeType: "application/pdf",
      } : 
      {
        type: "image",
        image: Buffer.from(arrayBuffer).toString('base64'),
      };

    // Process with Claude
    const model = getModel('claude-3-5-sonnet-20241022');
    const aiResponse = await generateObject({
      model,
      schema: z.object({
        text: z.string(),
      }),
      messages: [
        {
          role: "system",
          content: "You are an OCR assistant. Extract all text from the provided document or image. If there are any diagrams or visual elements, describe them briefly. If there are any tables, extract them as a table. If there are any images, describe them briefly. Use markdown formatting.",
        },
        {
          role: "user",
          content: [
            fileContent,
            {
              type: "text",
              text: "Please extract all text from this file.",
            },
          ],
        },
      ],
    });

    // Update database with results
    await db
      .update(uploadedFiles)
      .set({
        status: "completed",
        textContent: aiResponse.object.text,
        tokensUsed: aiResponse.usage.totalTokens,
        updatedAt: new Date(),
      })
      .where(eq(uploadedFiles.id, fileId));

    // Update user's token usage
    await incrementAndLogTokenUsage(userId, aiResponse.usage.totalTokens);

    return NextResponse.json({
      success: true,
      text: aiResponse.object.text,
    });
  } catch (error) {
    console.error("Processing error:", error);

    // Update file status to error if we have a fileId
    if (fileId !== null) {
      await db
        .update(uploadedFiles)
        .set({
          status: "error",
          error: error.message,
          updatedAt: new Date(),
        })
        .where(eq(uploadedFiles.id, fileId));
    }

    return NextResponse.json(
      { error: "Failed to process file" },
      { status: 500 }
    );
  }
} 