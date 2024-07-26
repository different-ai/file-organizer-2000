import { NextRequest, NextResponse } from "next/server";
import { handleAuthorization } from "@/lib/handleAuthorization";

export async function POST(request: NextRequest) {
  try {
    const { userId } = await handleAuthorization(request);

    // If handleAuthorization doesn't throw an error, the key is valid
    return NextResponse.json({ message: "Valid key", userId }, { status: 200 });
  } catch (error) {
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    return NextResponse.json({ error: "Invalid key" }, { status: 401 });
  }
}
