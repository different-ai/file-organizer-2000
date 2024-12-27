import { createOpenAI } from "@ai-sdk/openai";
import { generateObject } from "ai";
import { z } from "zod";
import { execSync } from "child_process";
import path from "path";

export const releaseNotesSchema = z.object({
  releaseNotes: z.object({
    name: z
      .string()
      .describe(
        "A catchy release name that captures the main theme of changes"
      ),
    description: z
      .string()
      .describe("A user-friendly description of the changes and new features"),
    technicalChanges: z
      .array(z.string())
      .describe("Array of specific technical changes made"),
  }),
});

export type ReleaseNotes = z.infer<typeof releaseNotesSchema>["releaseNotes"];

function getDiff(repoRoot: string, targetVersion: string): string {
  try {
    const diff = execSync(`git diff ${targetVersion} -- packages/plugin`, {
      encoding: "utf-8",
      cwd: repoRoot,
    });

    const changedFilesOutput = execSync(
      `git diff --name-only ${targetVersion} -- packages/plugin`,
      {
        encoding: "utf-8",
        cwd: repoRoot,
      }
    );

    const changedFiles = changedFilesOutput
      .split("\n")
      .map((file) => file.trim())
      .filter((file) => file.startsWith("packages/plugin/") && file.length > 0);

    console.log("Changed files in packages/plugin:");
    changedFiles.forEach((file) => console.log(`- ${file}`));

    return `Changes in packages/plugin:\n\n${diff}`;
  } catch (error) {
    console.error("Error getting git diff:", error);
    return "";
  }
}

export interface GenerateOptions {
  repoRoot: string;
  openAIApiKey: string;
}

export async function generateReleaseNotes(
  version: string,
  options: GenerateOptions
): Promise<ReleaseNotes> {
  const openai = createOpenAI({
    compatibility: "strict",
    apiKey: options.openAIApiKey,
  });

  const model = openai("gpt-4o");
  const diff = getDiff(options.repoRoot, version);

  try {
    const { object } = await generateObject({
      model,
      schema: releaseNotesSchema,
      prompt: `You are a release notes generator for an Obsidian plugin called File Organizer 2000.
Given the following git diff between versions, generate a user-friendly release name and description.
Focus on the user-facing changes and new features that will benefit users.

// only use first 100k characters of diff
${diff.slice(0, 100000)}`,
    });

    return object.releaseNotes;
  } catch (error) {
    console.error("Error generating release notes:", error);
    return {
      name: `Version ${version}`,
      description: "No description available",
      technicalChanges: [],
    };
  }
}

// CLI support
if (require.main === module) {
  const version = process.argv[2];
  const repoRoot = process.argv[3] || process.cwd();

  if (!version) {
    console.error("Please provide a version number");
    process.exit(1);
  }

  if (!process.env.OPENAI_API_KEY) {
    console.error("Please set OPENAI_API_KEY environment variable");
    process.exit(1);
  }

  generateReleaseNotes(version, {
    repoRoot,
    openAIApiKey: process.env.OPENAI_API_KEY,
  })
    .then((notes) => {
      console.log(JSON.stringify(notes, null, 2));
    })
    .catch((error) => {
      console.error("Error:", error);
      process.exit(1);
    });
}
