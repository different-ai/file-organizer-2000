import { NextResponse } from "next/server";
import { db, vercelTokens } from "@/drizzle/schema";
import { auth } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";
import { Vercel } from "@vercel/sdk";

export async function POST(request: Request) {
  try {
    const { userId } = auth();
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { provider, modelApiKey, modelName, soloApiKey } = await request.json();

    const [deployment] = await db
      .select()
      .from(vercelTokens)
      .where(eq(vercelTokens.userId, userId))
      .limit(1);

    if (!deployment) {
      return new NextResponse("No deployment found", { status: 404 });
    }

    const vercel = new Vercel({
      bearerToken: deployment.token,
    });

    // Prepare environment variables
    const envVars = [
      {
        key: provider === 'anthropic' ? 'ANTHROPIC_API_KEY' : 'OPENAI_API_KEY',
        value: modelApiKey,
        type: "encrypted",
        target: ["production"],
      },
    ];

    // Add SOLO_API_KEY if provided
    if (soloApiKey) {
      envVars.push({
        key: 'SOLO_API_KEY',
        value: soloApiKey,
        type: "encrypted",
        target: ["production"],
      });
    }

    // Update environment variables using the correct method
    await vercel.projects.createProjectEnv({
      idOrName: deployment.projectId,
      upsert: 'true',
      // @ts-ignore
      requestBody: envVars,
    })



    // Update database record
    await db
      .update(vercelTokens)
      .set({
        modelProvider: provider,
        modelName,
        lastApiKeyUpdate: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(vercelTokens.userId, userId));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating API key:", error);
    return NextResponse.json(
      { error: "Failed to update API key" },
      { status: 500 }
    );
  }
} 