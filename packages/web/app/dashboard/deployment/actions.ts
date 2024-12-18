"use server";

import { db, vercelTokens } from "@/drizzle/schema";
import { auth } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";
import { Vercel } from "@vercel/sdk";
import { createLicenseKeyFromUserId } from "@/app/actions";

type UpdateKeysResult = {
  success: boolean;
  error?: string;
  newLicenseKey?: string;
};

export async function updateKeys({
  modelName,
  visionModelName,
  openaiKey,
  anthropicKey,
  generateNewLicenseKey,
}: {
  modelName: string;
  visionModelName?: string;
  openaiKey?: string;
  anthropicKey?: string;
  generateNewLicenseKey?: boolean;
}): Promise<UpdateKeysResult> {
  try {
    const { userId } = auth();
    if (!userId) {
      return { success: false, error: "Unauthorized" };
    }

    const [deployment] = await db
      .select()
      .from(vercelTokens)
      .where(eq(vercelTokens.userId, userId))
      .limit(1);

    if (!deployment) {
      return { success: false, error: "No deployment found" };
    }

    const vercel = new Vercel({
      bearerToken: deployment.token,
    });

    // Generate new license key if requested
    let newLicenseKey: string | undefined;
    if (generateNewLicenseKey) {
      const apiKey = await createLicenseKeyFromUserId(userId);
      newLicenseKey = apiKey.key.key;
    }

    // Prepare environment variables
    const envVars = [
      {
        key: 'MODEL_NAME',
        value: modelName,
        type: "plain",
        target: ["production"],
      },
    ];

    if (visionModelName) {
      envVars.push({
        key: 'VISION_MODEL_NAME',
        value: visionModelName,
        type: "plain",
        target: ["production"],
      });
    }

    // Only add API keys if provided
    if (openaiKey?.trim()) {
      envVars.push({
        key: 'OPENAI_API_KEY',
        value: openaiKey,
        type: "encrypted",
        target: ["production"],
      });
    }

    if (anthropicKey?.trim()) {
      envVars.push({
        key: 'ANTHROPIC_API_KEY',
        value: anthropicKey,
        type: "encrypted",
        target: ["production"],
      });
    }

    if (newLicenseKey) {
      envVars.push({
        key: 'SOLO_API_KEY',
        value: newLicenseKey,
        type: "encrypted",
        target: ["production"],
      });
    }

    // Update environment variables
    await vercel.projects.createProjectEnv({
      idOrName: deployment.projectId,
      upsert: 'true',
      // @ts-ignore
      requestBody: envVars,
    });

    // Update database record
    await db
      .update(vercelTokens)
      .set({
        modelName,
        visionModelName: visionModelName || modelName,
        lastApiKeyUpdate: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(vercelTokens.userId, userId));

    return { 
      success: true,
      newLicenseKey: newLicenseKey,
    };
  } catch (error) {
    console.error("Error updating keys:", error);
    return {
      success: false,
      error: "Failed to update keys",
    };
  }
}