import { NextRequest, NextResponse } from "next/server";


export async function GET(request: NextRequest) {
  try {
    // const { userId } = await handleAuthorizationV2(request);
    const hasCatalystAccess = true

    return NextResponse.json({ hasCatalystAccess });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to check premium status" },
      { status: 500 }
    );
  }
}
