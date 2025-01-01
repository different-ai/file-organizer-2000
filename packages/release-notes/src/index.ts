import { createOpenAI } from "@ai-sdk/openai";
import { generateObject } from "ai";
import { z } from "zod";
import { execSync } from "child_process";
import path from "path";
import fs from "fs/promises";
import crypto from "crypto";

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

const diffCache = new Map<string, string>();

function getDiff(repoRoot: string, targetVersion: string): string {
  const cacheKey = `${repoRoot}-${targetVersion}`;
  if (diffCache.has(cacheKey)) {
    return diffCache.get(cacheKey)!;
  }

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

    diffCache.set(cacheKey, diff);
    return diff;
  } catch (error) {
    console.error("Error getting git diff:", error);
    return "";
  }
}

export interface GenerateOptions {
  repoRoot: string;
  openAIApiKey: string;
}

interface VersionInfo {
  previous: string;
  new: string;
  type: 'patch' | 'minor' | 'major';
}

async function updateVersions(increment: VersionInfo['type'], repoRoot: string): Promise<VersionInfo> {
  const manifestPath = path.join(repoRoot, 'manifest.json');
  const manifestContent = await fs.readFile(manifestPath, 'utf-8');
  const manifest = JSON.parse(manifestContent);
  const previousVersion = manifest.version;
  const [major, minor, patch] = previousVersion.split('.').map(Number);
  
  let newVersion;
  switch (increment) {
    case 'major':
      newVersion = `${major + 1}.0.0`;
      break;
    case 'minor':
      newVersion = `${major}.${minor + 1}.0`;
      break;
    case 'patch':
      newVersion = `${major}.${minor}.${patch + 1}`;
      break;
  }

  // Update manifest.json
  manifest.version = newVersion;
  await fs.writeFile(manifestPath, JSON.stringify(manifest, null, 2));

  // Update package.json in plugin directory
  const pluginPackagePath = path.join(repoRoot, 'packages/plugin/package.json');
  const pluginPackageContent = await fs.readFile(pluginPackagePath, 'utf-8');
  const pluginPackage = JSON.parse(pluginPackageContent);
  pluginPackage.version = newVersion;
  await fs.writeFile(pluginPackagePath, JSON.stringify(pluginPackage, null, 2));

  // Stage the changes
  execSync('git add manifest.json packages/plugin/package.json', { cwd: repoRoot });
  execSync(`git commit -m "chore(release): bump version to ${newVersion}"`, { cwd: repoRoot });
  
  return {
    previous: previousVersion,
    new: newVersion,
    type: increment
  };
}

async function generateReleaseNotes(
  version: string,
  options: GenerateOptions
): Promise<ReleaseNotes> {
  const openai = createOpenAI({
    compatibility: "strict",
    apiKey: options.openAIApiKey,
  });

  const model = openai("gpt-4o");
  const diff = getDiff(options.repoRoot, version);
  
  const maxRetries = 3;
  let attempt = 0;
  
  while (attempt < maxRetries) {
    try {
      const { object } = await generateObject({
        model,
        schema: releaseNotesSchema,
        prompt: `You are a release notes generator for an Obsidian plugin called File Organizer 2000.
Given the following git diff between versions, generate a user-friendly release name and description.
Focus on the user-facing changes and new features that will benefit users.

${diff.slice(0, 100000)}`,
      });
      
      return object.releaseNotes;
    } catch (error) {
      attempt++;
      if (attempt === maxRetries) throw error;
      await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
    }
  }
  
  throw new Error('Failed to generate release notes after retries');
}

async function prepareReleaseArtifacts(version: string): Promise<string[]> {
  const artifactFiles = [
    'main.js',
    'styles.css',
    'manifest.json'
  ];
  
  const artifacts = await Promise.all(
    artifactFiles.map(async (file) => {
      const source = path.join('packages/plugin/dist', file);
      const target = path.join('release-artifacts', file);
      await fs.copyFile(source, target);
      return target;
    })
  );
  
  const checksums = await Promise.all(
    artifacts.map(async (file) => {
      const content = await fs.readFile(file);
      const hash = crypto.createHash('sha256').update(content).digest('hex');
      return `${hash}  ${path.basename(file)}`;
    })
  );
  
  await fs.writeFile('release-artifacts/checksums.txt', checksums.join('\n'));
  return artifacts;
}

async function generateReleaseArtifacts(version: string, options: GenerateOptions): Promise<void> {
  await Promise.all([
    execSync('pnpm --filter "./packages/plugin" build'),
    generateReleaseNotes(version, options),
    fs.mkdir('release-artifacts', { recursive: true })
  ]);
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

export { generateReleaseArtifacts, prepareReleaseArtifacts, updateVersions };
