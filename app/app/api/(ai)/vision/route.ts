import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const apiKey = process.env.OPENAI_API_KEY || "";
    const payload = await request.json();
    console.log("payload text route", payload);

    const model = "gpt-4-turbo";

    const data = {
      ...payload,
      model,
    };

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      console.log(`Error: ${response.status}`);
      return NextResponse.json(
        { message: `Server responded with status: ${response.status}` },
        { status: response.status }
      );
    }

    if (response.status === 401) {
      console.log("Invalid API key");
      return NextResponse.json({ message: "Invalid API key" }, { status: 401 });
    }
    const result = await response.json();
    return NextResponse.json(result);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: "Error" }, { status: 500 });
  }
}