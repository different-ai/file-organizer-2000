import { NextRequest, NextResponse } from "next/server";
import { handleAuthorization } from "@/lib/handleAuthorization";
import { db, uploadedFiles } from "@/drizzle/schema";
import { eq, desc, sql } from "drizzle-orm";

export async function GET(request: NextRequest) {
  try {
    const { userId } = await handleAuthorization(request);
    const page = parseInt(request.nextUrl.searchParams.get("page") || "1", 10);
    const limit = parseInt(request.nextUrl.searchParams.get("limit") || "10", 10);
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

    return NextResponse.json({
      files,
      pagination: {
        total: count,
        page,
        limit,
        totalPages: Math.ceil(count / limit),
      },
    });
  } catch (error) {
    console.error("List files error:", error);
    return NextResponse.json(
      { error: "Failed to list files" },
      { status: 500 }
    );
  }
}
