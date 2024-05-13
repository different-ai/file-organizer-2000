import { generateModelCall } from "./prompt";
import { NextResponse } from "next/server";

export const maxDuration = 60;

export async function POST(request: Request) {
  try {
    const { content, formattingInstruction } = await request.json();

    const call = generateModelCall(content, formattingInstruction);
    const response = await call();

    return NextResponse.json({ message: response.formattedText });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: "Error" }, { status: 500 });
  }
}
