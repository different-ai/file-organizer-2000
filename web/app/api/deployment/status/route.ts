import { NextResponse } from "next/server";
import { db, vercelTokens } from "@/drizzle/schema";
import { auth } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";
import { Vercel } from "@vercel/sdk";

export async function GET() {
  try {
    const { userId } = auth();
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const [deployment] = await db
      .select()
      .from(vercelTokens)
      .where(eq(vercelTokens.userId, userId))
      .limit(1);

    if (!deployment) {
      return new NextResponse("No deployment found", { status: 404 });
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
    const currentModelName = envs.find(env => env.key === "MODEL_NAME")?.value || 'gpt-4o';
    const currentVisionModelName = envs.find(env => env.key === "VISION_MODEL_NAME")?.value || 'gpt-4o';

    return NextResponse.json({
      projectUrl: deployment.projectUrl,
      deploymentUrl: deployment.deploymentUrl,
      lastDeployment: deployment.lastDeployment,
      modelName: currentModelName,
      visionModelName: currentVisionModelName,
      lastApiKeyUpdate: deployment.lastApiKeyUpdate,
      openaiKeyPresent,
      anthropicKeyPresent,
    });
  } catch (error) {
    console.error("Error fetching deployment status:", error);
    return NextResponse.json(
      { error: "Failed to fetch deployment status" },
      { status: 500 }
    );
  }
}
