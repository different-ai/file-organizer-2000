import { createOpenAI } from '@ai-sdk/openai';
import { generateObject } from 'ai';
import { z } from 'zod';
import { execSync } from 'child_process';
import path from 'path';
import * as fs from 'fs';
import ignore from 'ignore';

export const releaseNotesSchema = z.object({
  releaseNotes: z.object({
    name: z.string().describe('A catchy release name that captures the main theme of changes'),
    description: z.string().describe('A user-friendly description of the changes and new features'),
    technicalChanges: z.array(z.string()).describe('Array of specific technical changes made'),
  }),
});

export type ReleaseNotes = z.infer<typeof releaseNotesSchema>['releaseNotes'];

const EXCLUDED_FILES = [
  'pnpm-lock.yaml',
  'yarn.lock',
  'package-lock.json',
  '.gitignore',
  'tsconfig.json',
  'manifest.json',
  'package.json'
];

function getGitIgnorePatterns(repoRoot: string): string[] {
  try {
    const gitIgnorePath = path.join(repoRoot, '.gitignore');
    if (fs.existsSync(gitIgnorePath)) {
      const gitIgnoreContent = fs.readFileSync(gitIgnorePath, 'utf-8');
      return gitIgnoreContent
        .split('\n')
        .map(line => line.trim())
        .filter(line => line && !line.startsWith('#'));
    }
  } catch (error) {
    console.error('Error reading .gitignore:', error);
  }
  return [];
}

function getDiff(repoRoot: string): string {
  try {
    // Get the diff of staged changes
    const diff = execSync('git diff HEAD~1 HEAD', { 
      encoding: 'utf-8',
      cwd: repoRoot
    });
    
    // Set up ignore patterns
    const ig = ignore();
    ig.add(getGitIgnorePatterns(repoRoot));
    
    // Filter out excluded files
    const diffLines = diff.split('\n');
    let relevantDiff = '';
    let isExcludedFile = false;
    let currentFile = '';

    for (const line of diffLines) {
      if (line.startsWith('diff --git')) {
        currentFile = line.split(' b/')[1];
        // Check both explicit exclusions and gitignore patterns
        isExcludedFile = EXCLUDED_FILES.some(excluded => 
          currentFile.endsWith(excluded) || currentFile.includes('node_modules')
        ) || ig.ignores(currentFile);
      }
      if (!isExcludedFile) {
        relevantDiff += line + '\n';
      }
    }

    return relevantDiff;
  } catch (error) {
    console.error('Error getting git diff:', error);
    return '';
  }
}

export interface GenerateOptions {
  repoRoot: string;
  openAIApiKey: string;
}

export async function generateReleaseNotes(version: string, options: GenerateOptions): Promise<ReleaseNotes> {
  const openai = createOpenAI({
    compatibility: 'strict',
    apiKey: options.openAIApiKey,
  });

  const model = openai('gpt-4o');
  const diff = getDiff(options.repoRoot);

  try {
    const { object } = await generateObject({
      model,
      schema: releaseNotesSchema,
      prompt: `You are a release notes generator for an Obsidian plugin called File Organizer 2000.
Given the following git diff, generate a user-friendly release name and description.
Focus on the user-facing changes and new features that will benefit users.

Git diff:
${diff}`,
    });

    return object.releaseNotes;
  } catch (error) {
    console.error('Error generating release notes:', error);
    return {
      name: `Version ${version}`,
      description: 'No description available',
      technicalChanges: [],
    };
  }
}

// CLI support
if (require.main === module) {
  const version = process.argv[2];
  const repoRoot = process.argv[3] || process.cwd();
  
  if (!version) {
    console.error('Please provide a version number');
    process.exit(1);
  }

  if (!process.env.OPENAI_API_KEY) {
    console.error('Please set OPENAI_API_KEY environment variable');
    process.exit(1);
  }

  generateReleaseNotes(version, {
    repoRoot,
    openAIApiKey: process.env.OPENAI_API_KEY,
  })
    .then(notes => {
      console.log(JSON.stringify(notes, null, 2));
    })
    .catch(error => {
      console.error('Error:', error);
      process.exit(1);
    });
} 