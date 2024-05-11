import { generateModelCall } from "./prompt";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { document } = await request.json();

    const call = generateModelCall(document);
    console.log("name is using model", process.env.MODEL_NAME);
    const response = await call();

    return NextResponse.json({ name: response.name });
  } catch (error) {
    console.error(error);
    if (error.response && error.response.status === 401) {
      console.log("Invalid OpenAI API key");
      return NextResponse.json({ message: "Invalid API key" }, { status: 401 });
    } else {
      return NextResponse.json({ message: "Error" }, { status: 500 });
    }
  }
}
