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
  googleKey,
  generateNewLicenseKey,
}: {
  modelName: string;
  visionModelName?: string;
  openaiKey?: string;
  anthropicKey?: string;
  googleKey?: string;
  generateNewLicenseKey?: boolean;
}): Promise<UpdateKeysResult> {
  try {
    const { userId } = await auth();
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

    if (googleKey?.trim()) {
      envVars.push({
        key: 'GOOGLE_API_KEY',
        value: googleKey,
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

export async function getDeploymentStatus() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return { error: "Unauthorized", status: 401 };
    }

    const [deployment] = await db
      .select()
      .from(vercelTokens)
      .where(eq(vercelTokens.userId, userId))
      .limit(1);

    if (!deployment) {
      return { error: "No deployment found", status: 404 };
    }

    // Check for API keys and model names in Vercel environment
    const vercel = new Vercel({
      bearerToken: deployment.token,
    });

    // @ts-ignore
    const { envs } = await vercel.projects.filterProjectEnvs({
      idOrName: deployment.projectId,
    });

    // Find environment variables
    const openaiKeyPresent = envs.some(env => env.key === "OPENAI_API_KEY");
    const anthropicKeyPresent = envs.some(env => env.key === "ANTHROPIC_API_KEY");
    const googleKeyPresent = envs.some(env => env.key === "GOOGLE_API_KEY");
    const currentModelName = envs.find(env => env.key === "MODEL_NAME")?.value || 'gpt-4o';
    const currentVisionModelName = envs.find(env => env.key === "VISION_MODEL_NAME")?.value || 'gpt-4o';

    return {
      projectUrl: deployment.projectUrl,
      deploymentUrl: deployment.deploymentUrl,
      lastDeployment: deployment.lastDeployment,
      modelName: currentModelName,
      visionModelName: currentVisionModelName,
      lastApiKeyUpdate: deployment.lastApiKeyUpdate,
      openaiKeyPresent,
      anthropicKeyPresent,
      googleKeyPresent,
    };
  } catch (error) {
    console.error("Error fetching deployment status:", error);
    return { error: "Failed to fetch deployment status", status: 500 };
  }
}