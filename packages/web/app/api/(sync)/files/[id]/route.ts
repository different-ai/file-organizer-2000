import { NextRequest, NextResponse } from "next/server";
import { deleteFile } from "@/app/dashboard/sync/actions";
import { auth } from "@clerk/nextjs/server";

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check authentication first
    const { userId } = await auth();
    if (!userId) {
      console.error("Unauthorized file deletion attempt");
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }
    
    const fileId = parseInt(params.id, 10);
    if (isNaN(fileId)) {
      return NextResponse.json(
        { error: "Invalid file ID" },
        { status: 400 }
      );
    }

    const result = await deleteFile(fileId);
    
    if (!result.success) {
      return NextResponse.json(
        { error: result.error || "Failed to delete file" },
        { status: result.error === "Unauthorized" ? 401 : 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete file error:", error);
    return NextResponse.json(
      { error: "Failed to delete file" },
      { status: 500 }
    );
  }
}