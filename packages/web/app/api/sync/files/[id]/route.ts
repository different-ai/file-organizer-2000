import { NextRequest, NextResponse } from "next/server";
import { handleAuthorization } from "../../../../lib/handleAuthorization";
import { db, uploadedFiles } from "../../../../drizzle/schema";
import { and, eq } from "drizzle-orm";

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = await handleAuthorization(request);
    const fileId = parseInt(params.id, 10);

    // Delete the file
    await db
      .delete(uploadedFiles)
      .where(
        and(
          eq(uploadedFiles.id, fileId),
          eq(uploadedFiles.userId, userId)
        )
      );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete file error:", error);
    return NextResponse.json(
      { error: "Failed to delete file" },
      { status: 500 }
    );
  }
}
