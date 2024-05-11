import { generateModelCall } from "./prompt";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { content, formattingInstruction } = await request.json();
    console.log("text is using model", process.env.MODEL_TEXT);

    const call = generateModelCall(content, formattingInstruction);
    const response = await call();

    return NextResponse.json({ message: response.formattedText });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: "Error" }, { status: 500 });
  }
}
