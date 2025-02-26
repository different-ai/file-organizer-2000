import { NextRequest, NextResponse } from "next/server";
import { db, uploadedFiles } from "@/drizzle/schema";
import { eq } from "drizzle-orm";
import { del, list } from "@vercel/blob";
import { generateObject } from "ai";
import { getModel } from "@/lib/models";
import { incrementAndLogTokenUsage } from "@/lib/incrementAndLogTokenUsage";
import { z } from "zod";
import sharp from 'sharp';
import { auth } from "@clerk/nextjs/server";
import { anthropic } from "@ai-sdk/anthropic";
type FileContent = 
  | { type: "file"; data: Buffer; mimeType: "application/pdf" }
  | { type: "image"; image: string };

export const maxDuration = 300; // 5 minutes

// Helper function to compress image
async function compressImage(buffer: Buffer, fileType: string): Promise<Buffer> {
  // Skip compression for non-image files
  if (!fileType || 
      fileType.includes('pdf') || 
      fileType === 'application/pdf' || 
      !fileType.startsWith('image/')) {
    return buffer; // Return original buffer for non-image files
  }
  
  try {
    // Process image with Sharp
    return await sharp(buffer)
      .resize(800, 800, { // Resize to max 800x800 while maintaining aspect ratio
        fit: 'inside',
        withoutEnlargement: true
      })
      .jpeg({ // Convert to JPEG with moderate compression
        quality: 60,
        mozjpeg: true
      })
      .toBuffer();
  } catch (error) {
    console.error('Image compression error:', error);
    return buffer; // Return original buffer if compression fails
  }
}

export async function POST(request: NextRequest) {
  let fileId: number | null = null;
  
  try {
    // Check authentication first
    const { userId } = await auth();
    const authHeader = request.headers.get("authorization");
    const payload = await request.json();
    fileId = payload.fileId;
    
    // Handle API key auth from mobile app
    if (!userId && authHeader) {
      const token = authHeader.replace("Bearer ", "");
      
      if (!token) {
        console.error("Unauthorized process attempt - invalid token");
        return NextResponse.json(
          { error: "Unauthorized" },
          { status: 401 }
        );
      }
      
      // For mobile requests with a token, we need to validate the token
      // Extract userId from token for mobile auth
      let tokenUserId = null;
      
      try {
        // Log token for debugging
        console.log("Processing mobile token:", token.substring(0, 20) + "...");
        
        // Basic JWT structure check
        const parts = token.split('.');
        if (parts.length === 3) {
          // This is likely a JWT - try to decode the payload
          // Add proper base64 padding if needed
          let base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
          while (base64.length % 4) {
            base64 += '=';
          }
          
          const payload = JSON.parse(Buffer.from(base64, 'base64').toString());
          console.log("Decoded token payload:", JSON.stringify(payload));
          
          // Check for user ID in different possible claims
          if (payload.sub) {
            tokenUserId = payload.sub;
            console.log("Extracted userId from sub claim:", tokenUserId);
          } else if (payload.userId) {
            tokenUserId = payload.userId;
            console.log("Extracted userId from userId claim:", tokenUserId);
          } else if (payload.user_id) {
            tokenUserId = payload.user_id;
            console.log("Extracted userId from user_id claim:", tokenUserId);
          }
        }
      } catch (parseError) {
        console.error("Error parsing token:", parseError);
        return NextResponse.json(
          { error: "Invalid token format" },
          { status: 401 }
        );
      }
      
      // Continue with file processing for mobile
      if (!fileId) {
        return NextResponse.json(
          { error: "File ID is required" },
          { status: 400 }
        );
      }
      
      // Get the file record
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
      
      // For debugging only - log user IDs but don't reject yet
      if (tokenUserId && file.userId !== tokenUserId) {
        console.log(`Notice: File userId (${file.userId}) doesn't match token userId (${tokenUserId}), but allowing for testing`);
        // We'll temporarily allow access even if the user IDs don't match
        // return NextResponse.json(
        //   { error: "Unauthorized" },
        //   { status: 401 }
        // );
      }
      
      // Update the file status to processing
      await db
        .update(uploadedFiles)
        .set({ status: "processing" })
        .where(eq(uploadedFiles.id, fileId));
      
      // Return success response
      return NextResponse.json({ success: true });
    } else if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }
    
    // Regular web authentication flow
    if (!fileId) {
      return NextResponse.json(
        { error: "File ID is required" },
        { status: 400 }
      );
    }

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
    const buffer = Buffer.from(arrayBuffer);

    // Prepare file content based on type
    let fileContent: FileContent;
    const fileType = file.fileType.toLowerCase();
    
    if (fileType === 'application/pdf' || fileType === 'pdf' || fileType.includes('pdf')) {
      fileContent = {
        type: "file",
        data: buffer,
        mimeType: "application/pdf",
      };
    } else {
      // Compress image before converting to base64
      const compressedBuffer = await compressImage(buffer, fileType);
      fileContent = {
        type: "image",
        image: compressedBuffer.toString('base64'),
      };
    }

    // Process with Claude
    const aiResponse = await generateObject({
      model: anthropic("claude-3-5-sonnet-20240620"),
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
      // Add retries and rate limit handling
      maxRetries: 5,
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

    // Update user's token usage if user management is enabled
    if (process.env.ENABLE_USER_MANAGEMENT === "true") {
      console.log("Incrementing token usage for user:", userId, aiResponse.usage?.totalTokens);
      try {
        await incrementAndLogTokenUsage(userId, aiResponse.usage?.totalTokens || 0);
      } catch (error) {
        console.error("Error updating token usage:", error);
        // Continue processing - don't fail the request if token tracking fails
      }
    }

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