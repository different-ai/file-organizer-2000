import { NextResponse } from "next/server";
import { db, vercelTokens } from "@/drizzle/schema";
import { Vercel } from "@vercel/sdk";
import { auth } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";

export async function POST() {
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

    const vercel = new Vercel({
      bearerToken: deployment.token,
    });

    const repo = "file-organizer-2000";
    const org = "different-ai";
    const ref = "master";

    // Create new deployment
    const result = await vercel.deployments.createDeployment({
      requestBody: {
        name: `file-organizer-redeploy-${Date.now()}`,
        target: "production",
        project: deployment.projectId,
        gitSource: {
          type: "github",
          repo,
          ref,
          org,
        },
        projectSettings: {
          framework: "nextjs",
          buildCommand: "pnpm build:self-host",
          installCommand: "pnpm install",
          outputDirectory: ".next",
          rootDirectory: "web",
        },
      },
    });

    // Update last deployment timestamp
    await db
      .update(vercelTokens)
      .set({
        lastDeployment: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(vercelTokens.userId, userId));

    return NextResponse.json({
      success: true,
      deploymentUrl: result.url,
    });
  } catch (error) {
    console.error("Error in redeploy:", error);
    return NextResponse.json(
      { error: "Failed to redeploy" },
      { status: 500 }
    );
  }
} 