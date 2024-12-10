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

    const tokenRecord = await db
      .select()
      .from(vercelTokens)
      .where(eq(vercelTokens.userId, userId))
      .limit(1);

    if (!tokenRecord[0] || !tokenRecord[0].projectId) {
      return new NextResponse("No deployment found", { status: 404 });
    }

    const vercel = new Vercel({
      bearerToken: tokenRecord[0].token,
    });
    const repo = "file-organizer-2000";
    const org = "different-ai";
    const ref = "master";

    const deployment = await vercel.deployments.createDeployment({
      requestBody: {
        name: `file-organizer-redeploy-${Date.now()}`,
        target: "production",
        project: tokenRecord[0].projectId,
        gitSource: {
          type: "github",
          repo: repo,
          ref: ref,
          org: org,
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

    return NextResponse.json({
      success: true,
      deploymentUrl: deployment.url,
    });
  } catch (error) {
    console.error("Error in redeploy:", error);
    return NextResponse.json(
      { error: "Failed to redeploy" },
      { status: 500 }
    );
  }
} 