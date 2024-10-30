import fs from "fs";
import { tmpdir } from "os";
import { join } from "path";
import { promises as fsPromises } from "fs";
import { NextResponse } from "next/server";
import { createOpenAI } from "@ai-sdk/openai";
import { streamText } from "ai";
import { z } from "zod";

export const maxDuration = 60;

export async function POST(request: Request) {
  try {
    const { audio, extension } = await request.json();
    const base64Data = audio.split(";base64,").pop();
    
    // Create temporary file for audio
    const tempFilePath = join(tmpdir(), `upload_${Date.now()}.${extension}`);
    await fsPromises.writeFile(tempFilePath, base64Data, {
      encoding: "base64",
    });

    const apiKey = process.env.OPENAI_API_KEY;
    const openai = createOpenAI({ apiKey });

    // Stream the text generation using gpt-4o-audio-preview
    const { textStream } = await streamText({
      model: openai("gpt-4o-audio-preview"),
      tools: {
        "get-todo-list": {
          description: "Get the todo list",
          parameters: z.object({
            todoList: z.array(z.string()),
          }),
          execute: async ({ todoList }) => {
            console.log("Todo list:", todoList);
          },
        },
        "add-todo": {
          description: "Add a todo to the list",
          parameters: z.object({
            todo: z.string(),
          }),
          execute: async ({ todo }) => {
            console.log("Adding todo:", todo);
          },
        },
      },
      messages: [
        {
          role: "user",
          content: [
            {
              type: "file",
              mimeType: "audio/wav",
              data: base64Data,
            },
          ],
        },
      ],
    });

    // Collect the full text from the stream
    let fullText = "";
    for await (const chunk of textStream) {
      fullText += chunk;
    }

    // Clean up temporary file
    await fsPromises.unlink(tempFilePath);

    return NextResponse.json({ text: fullText });
  } catch (error) {
    console.error("Transcription error:", error);
    return NextResponse.json(
      { error: "Failed to process audio" },
      { status: 500 }
    );
  }
}