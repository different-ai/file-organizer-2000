"use server";

import { auth } from "@clerk/nextjs/server";
import { db, uploadedFiles } from "@/drizzle/schema";
import { eq, desc, sql } from "drizzle-orm";
import { put } from "@vercel/blob";
import { revalidatePath } from "next/cache";

// Types
interface PaginationParams {
  page: number;
  limit: number;
}

interface FileListResponse {
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
}

interface FileStatusResponse {
  status: string;
  text: string | null;
  error: string | null;
}

interface UploadFileParams {
  name: string;
  type: string;
  base64: string;
}

interface UploadResponse {
  success: boolean;
  fileId?: number;
  status?: string;
  error?: string;
  retryable?: boolean;
}

const ALLOWED_FILE_TYPES = {
  "application/pdf": "pdf",
  "image/jpeg": "image",
  "image/png": "image",
  "image/webp": "image",
};

// Get files with pagination
export async function getFiles({ page = 1, limit = 10 }: PaginationParams): Promise<FileListResponse | { error: string }> {
  try {
    const { userId } = await auth();
    if (!userId) {
      return { error: "Unauthorized" };
    }

    const offset = (page - 1) * limit;

    // Get files with pagination
    const files = await db
      .select({
        id: uploadedFiles.id,
        originalName: uploadedFiles.originalName,
        fileType: uploadedFiles.fileType,
        status: uploadedFiles.status,
        createdAt: uploadedFiles.createdAt,
        tokensUsed: uploadedFiles.tokensUsed,
        error: uploadedFiles.error,
        textContent: uploadedFiles.textContent,
        blobUrl: uploadedFiles.blobUrl,
      })
      .from(uploadedFiles)
      .where(eq(uploadedFiles.userId, userId))
      .orderBy(desc(uploadedFiles.createdAt))
      .limit(limit)
      .offset(offset);

    // Get total count
    const [{ count }] = await db
      .select({
        count: sql<number>`count(*)`,
      })
      .from(uploadedFiles)
      .where(eq(uploadedFiles.userId, userId));

    return {
      files,
      pagination: {
        total: count,
        page,
        limit,
        totalPages: Math.ceil(count / limit),
      },
    };
  } catch (error) {
    console.error("List files error:", error);
    return { error: "Failed to list files" };
  }
}

// Get file status
export async function getFileStatus(fileId: number, token?: string): Promise<FileStatusResponse | { error: string }> {
  try {
    const { userId } = await auth();
    
    // If no userId from Clerk but we have a token, handle mobile authentication
    if (!userId && token) {
      try {
        // For mobile requests with a token, we need to validate the token
        // and find the associated user
        
        // Verify the token is valid (this should be replaced with your actual token validation logic)
        // For example, you might decode a JWT token or validate against a tokens table
        if (!token || token.length < 10) {
          console.error("Invalid token format");
          return { error: "Unauthorized" };
        }
        
        // Get file record - without checking userId for mobile token auth
        // In a production environment, you should extract the userId from the token
        // and verify that the file belongs to that user
        const [file] = await db
          .select()
          .from(uploadedFiles)
          .where(eq(uploadedFiles.id, fileId))
          .limit(1);
        
        if (!file) {
          console.error(`File not found: ${fileId}`);
          return { error: "File not found" };
        }
        
        // Return the file status for mobile requests
        return {
          status: file.status,
          text: file.textContent,
          error: file.error,
        };
      } catch (tokenError) {
        console.error("Token validation error:", tokenError);
        return { error: "Unauthorized" };
      }
    }
    
    // Regular web authentication flow
    if (!userId) {
      return { error: "Unauthorized" };
    }

    if (!fileId) {
      return { error: "File ID is required" };
    }

    // Get file record
    const [file] = await db
      .select()
      .from(uploadedFiles)
      .where(eq(uploadedFiles.id, fileId))
      .limit(1);

    if (!file) {
      return { error: "File not found" };
    }

    if (file.userId !== userId) {
      return { error: "Unauthorized" };
    }

    return {
      status: file.status,
      text: file.textContent,
      error: file.error,
    };
  } catch (error) {
    console.error("Status check error:", error);
    return { error: "Failed to check file status" };
  }
}

// Upload file
export async function uploadFile(
  { name: fileName, type: mimeType, base64 }: UploadFileParams,
  token?: string
): Promise<UploadResponse> {
  try {
    const { userId } = await auth();
    
    // If no userId from Clerk but we have a token, handle mobile authentication
    if (!userId && token) {
      // For mobile requests with a token, we need to validate the token
      // and find the associated user
      
      // This is a simplified example - you should implement proper token validation
      // based on your authentication strategy for mobile
      
      // For example, you might have a mapping of tokens to userIds in your database
      // or use a JWT token that contains the userId
      
      // For now, we'll use a placeholder userId for mobile uploads
      // In a real implementation, you would extract the actual userId from the token
      const mobileUserId = "mobile-user"; // Replace with actual user ID extraction from token
      
      // Continue with file upload using the mobile user ID
      if (!fileName || !mimeType || !base64) {
        return { 
          success: false, 
          error: "Missing required fields", 
          retryable: true 
        };
      }
      
      // Generate a unique blob name
      const blobName = `${Date.now()}-${fileName.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
      
      // Normalize file type for consistency
      let normalizedMimeType = mimeType;
      if (mimeType.toLowerCase().includes('pdf')) {
        normalizedMimeType = 'application/pdf';
      }
      
      // Upload to blob storage
      const { url } = await put(blobName, Buffer.from(base64, 'base64'), {
        contentType: normalizedMimeType,
        access: 'public',
      });
      
      // Create database record
      const [file] = await db
        .insert(uploadedFiles)
        .values({
          userId: mobileUserId,
          originalName: fileName,
          fileType: normalizedMimeType,
          status: 'uploaded',
          blobUrl: url,
        })
        .returning();
      
      return {
        success: true,
        fileId: file.id,
        status: file.status,
      };
    }
    
    // Regular web authentication flow
    if (!userId) {
      return { 
        success: false, 
        error: "Unauthorized", 
        retryable: false 
      };
    }

    if (!fileName || !mimeType || !base64) {
      return { 
        success: false, 
        error: "Missing required fields", 
        retryable: true 
      };
    }

    // Generate a unique blob name
    const blobName = `${Date.now()}-${fileName.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
    
    // Normalize file type for consistency
    let normalizedMimeType = mimeType;
    if (mimeType.toLowerCase().includes('pdf')) {
      normalizedMimeType = 'application/pdf';
    }
    
    // Upload to blob storage
    const { url } = await put(blobName, Buffer.from(base64, 'base64'), {
      contentType: normalizedMimeType,
      access: 'public',
    });
    
    // Create database record
    const [file] = await db
      .insert(uploadedFiles)
      .values({
        userId,
        originalName: fileName,
        fileType: normalizedMimeType,
        status: 'uploaded',
        blobUrl: url,
      })
      .returning();
    
    return {
      success: true,
      fileId: file.id,
      status: file.status,
    };
  } catch (error) {
    console.error("Upload error:", error);
    return { 
      success: false, 
      error: "Server error during upload", 
      retryable: true 
    };
  }
}

// Delete file
export async function deleteFile(fileId: number): Promise<{ success: boolean; error?: string }> {
  try {
    const { userId } = await auth();
    if (!userId) {
      return { success: false, error: "Unauthorized" };
    }

    // Check if file exists and belongs to user
    const [file] = await db
      .select()
      .from(uploadedFiles)
      .where(eq(uploadedFiles.id, fileId))
      .limit(1);

    if (!file) {
      return { success: false, error: "File not found" };
    }

    if (file.userId !== userId) {
      return { success: false, error: "Unauthorized" };
    }

    // Delete from database
    await db
      .delete(uploadedFiles)
      .where(eq(uploadedFiles.id, fileId));

    // Revalidate the files page to reflect the deletion
    revalidatePath('/dashboard/sync');

    return { success: true };
  } catch (error) {
    console.error("Delete file error:", error);
    return { success: false, error: "Failed to delete file" };
  }
} 