import { NextRequest, NextResponse } from "next/server";
import { handleCheckoutComplete, handleSubscriptionCanceled } from '@/lib/webhook/handlers';
import { verifyStripeWebhook } from "@/lib/webhook/verify";


export async function POST(req: NextRequest) {
  try {
    // Verify webhook signature and get event
    const event = await verifyStripeWebhook(req);
    
    // Handle different event types
    let result;
    switch (event.type) {
      case "checkout.session.completed":
        result = await handleCheckoutComplete(event);
        break;
      case "customer.subscription.deleted":
        result = await handleSubscriptionCanceled(event);
        break;
      // Add more handlers as needed
      default:
        return NextResponse.json({ 
          status: 200, 
          message: `Unhandled event type: ${event.type}` 
        });
    }

    if (!result.success) {
      console.error(result.error);
      return NextResponse.json({ error: result.message }, { status: 400 });
    }

    return NextResponse.json({ status: 200, message: result.message });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 400 }
    );
  }
}
import fs from "fs";
import OpenAI from "openai";
import { tmpdir } from "os";
import { join } from "path";
import { promises as fsPromises } from "fs";
import { NextResponse } from "next/server";

export const maxDuration = 60; // This function can run for a maximum of 5 seconds

export async function POST(request: Request) {
  console.log("transcribe");
  const { audio, extension } = await request.json();
  console.log({ audio, extension });
  const base64Data = audio.split(";base64,").pop();
  console.log({ extension });
  const tempFilePath = join(tmpdir(), `upload_${Date.now()}.${extension}`);
  await fsPromises.writeFile(tempFilePath, base64Data, {
    encoding: "base64",
  });

  const apiKey = process.env.OPENAI_API_KEY;
  const openai = new OpenAI({ apiKey });

  const transcription = await openai.audio.transcriptions.create({
    file: fs.createReadStream(tempFilePath),
    model: "whisper-1",
  });

  await fsPromises.unlink(tempFilePath);

  return NextResponse.json({ text: transcription.text });
}