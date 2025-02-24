import { App, TFolder, TFile, normalizePath, parseYaml } from "obsidian";
import { FileOrganizerSettings } from "./settings";
import { logger } from "./services/logger";

export async function ensureFolderExists(app: App, folderPath: string) {
  if (!(await app.vault.adapter.exists(folderPath))) {
    await app.vault.createFolder(folderPath);
  }
}

export async function checkAndCreateFolders(
  app: App,
  settings: FileOrganizerSettings
) {
  await ensureFolderExists(app, settings.pathToWatch);
  await ensureFolderExists(app, settings.defaultDestinationPath);
  await ensureFolderExists(app, settings.attachmentsPath);
  await ensureFolderExists(app, settings.logFolderPath);
  await ensureFolderExists(app, settings.templatePaths);
  await ensureFolderExists(app, settings.fabricPaths);
  await ensureFolderExists(app, settings.stagingFolder);
  await ensureFolderExists(app, settings.backupFolderPath);
}

export async function checkAndCreateTemplates(
  app: App,
  settings: FileOrganizerSettings
) {
  const meetingNoteTemplatePath = `${settings.templatePaths}/meeting_note.md`;
  const youtubeVideoTemplatePath = `${settings.templatePaths}/youtube_video.md`;
  const enhanceTemplatePath = `${settings.templatePaths}/enhance.md`;

  if (!(await app.vault.adapter.exists(meetingNoteTemplatePath))) {
    await app.vault.create(
      meetingNoteTemplatePath,
      `Contextual Extraction of Discussion Points and Action Items

Instruction:
Analyze the provided content, which includes:
	•	Transcript 1: The first transcript of the discussion.
	•	Transcript 2: The second transcript of the discussion.
	•	Written Notes: Notes taken by a participant summarizing the discussion.

Task:
Extract the following while prioritizing the notes written by the participant to infer emphasis and key takeaways:
	1.	Discussion Points: Summarize the key topics, ideas, or issues discussed. Prioritize points that appear in the written notes and cross-reference with the transcripts for completeness.
	2.	Action Items: Identify specific tasks, responsibilities, or decisions agreed upon. For each action item, include:
	•	A brief description of the task.
	•	The person(s) responsible, if mentioned.
	•	Any deadlines, if stated.

Output Format:

**Discussion Points:**  
1. [Point 1]  
2. [Point 2]  
...  

**Action Items:**  
1. [Task description] - [Responsible person(s)] - [Deadline]  
2. [Task description] - [Responsible person(s)] - [Deadline]  
...  

**Supporting Context:**  
- Key excerpts from Transcript 1: [Relevant excerpts related to discussion points and action items].  
- Key excerpts from Transcript 2: [Relevant excerpts related to discussion points and action items].  
- Key highlights from Written Notes: [Direct quotes or summaries from notes].  
`
    );
  }

  if (!(await app.vault.adapter.exists(youtubeVideoTemplatePath))) {
    await app.vault.create(
      youtubeVideoTemplatePath,
      `Please create an Obsidian note using the video link and any available transcript or additional context. The note must include:

1. Frontmatter (at the top) with the following properties:

---

topics: {{any relevant topics}}

tags: [#youtube, {{#any other relevant tags}}]

summary: {{short summary of the video}}

---

2. A YouTube embed link in the following format:

[![YouTube Video](https://www.youtube.com/watch?v=XXXXXXX)](https://www.youtube.com/watch?v=XXXXXXX)

3. A comprehensive, detailed summary of the key points from the video (below the embed link).

**Instructions:**

- First, determine or generate the values needed for the frontmatter (title, channel, date published, summary, etc.).

- Maintain the exact markdown syntax for the frontmatter block (\`---\` at the top and bottom).

- Use the YouTube link format exactly as provided. Do not remove the brackets, parentheses, or exclamation point.

- In the main body of the note, provide a longer-form summary describing all major points from the video.
- do not use \`\`\` \`\`\` or markdown formatting. Very important
- make sure published date is the date the video was published. Not the date

**Example Output Format** (template):

---

topics: "relevant topics"

tags: ["YouTube", "football"]

summary: "A short overview of the video's main theme."

---

[![YouTube Video](https://www.youtube.com/watch?v=XXXXXXX)](https://www.youtube.com/watch?v=XXXXXXX)

**Detailed Summary:**

- Key point 1…

- Key point 2…

- Etc.`
    );
  }

  if (!(await app.vault.adapter.exists(enhanceTemplatePath))) {
    await app.vault.create(
      enhanceTemplatePath,
      `1. **Use Headings and Subheadings**: Clearly define sections with headings (e.g.,
\`\`\`
#
\`\`\`
,
\`\`\`
##
\`\`\`
,
\`\`\`
###
\`\`\`
) to organize content hierarchically.

2. **Bullet Points and Lists**: Use bullet points or numbered lists to break down information into digestible parts.

3. **Consistent Spacing**: Ensure consistent spacing between sections and paragraphs for better readability.

4. **Highlight Key Points**: Use bold or italics to emphasize important information or key terms.

5. **Tables for Structured Data**: Use tables to organize data that fits into rows and columns for clarity.

6. **Quotes and References**: Use blockquotes for quotes and reference links for sources.

7. **Code Blocks**: Use code blocks for any code snippets or technical instructions.

8. **Images and Diagrams**: Include images or diagrams where applicable to visually represent information.

9. **Linking and Cross-referencing**: Use internal links to connect related notes or sections within your vault.

10. do not use \`\`\` markdown`
    );
  }
}

/**
 * @deprecated use safeMove instead
 */
export async function moveFile(
  app: App,
  sourceFile: TFile,
  newFileName: string,
  destinationFolder = ""
): Promise<TFile> {
  // Extract the file extension from the source file
  const fileExtension = sourceFile.extension;

  // Construct the initial target path
  let targetPath = `${destinationFolder}/${newFileName}.${fileExtension}`;
  const normalizedTargetPath = normalizePath(targetPath);

  // Check if a file with the same name already exists in the destination
  if (await app.vault.adapter.exists(normalizedTargetPath)) {
    // If it exists, create a unique filename by adding a timestamp
    const timestamp = Date.now();
    const uniqueFileName = `${newFileName}_${timestamp}`;
    targetPath = `${destinationFolder}/${uniqueFileName}.${fileExtension}`;
  }

  // Normalize the final path
  const normalizedFinalPath = normalizePath(targetPath);

  // Ensure the destination folder exists
  await ensureFolderExists(app, destinationFolder);

  // Move the file and update all links
  await app.fileManager.renameFile(sourceFile, normalizedFinalPath);

  // Get the moved file object and return it
  const movedFile = app.vault.getAbstractFileByPath(
    normalizedFinalPath
  ) as TFile;
  return movedFile;
}

export function isTFolder(file: any): file is TFolder {
  return file instanceof TFolder;
}

export function getAllFolders(app: App): string[] {
  const allFiles = app.vault.getAllLoadedFiles();
  const folderPaths = allFiles
    .filter(file => isTFolder(file))
    .map(folder => folder.path);

  return [...new Set(folderPaths)];
}

export async function getAvailablePath(
  app: App,
  desiredPath: string
): Promise<string> {
  let available = desiredPath;
  let increment = 0;

  while (await app.vault.adapter.exists(available)) {
    increment++;
    const lastDotIndex = available.lastIndexOf(".");
    const withoutExt = available.slice(0, lastDotIndex);
    const ext = available.slice(lastDotIndex);
    available = `${withoutExt} ${increment}${ext}`;
  }

  return available;
}

export async function safeCreate(
  app: App,
  desiredPath: string,
  content = ""
): Promise<TFile> {
  const parentPath = desiredPath.substring(0, desiredPath.lastIndexOf("/"));
  await ensureFolderExists(app, parentPath);

  const availablePath = await getAvailablePath(app, desiredPath);
  return await app.vault.create(availablePath, content);
}

export async function safeRename(
  app: App,
  file: TFile,
  newName: string
): Promise<void> {
  const parentPath = file.parent?.path ?? '';
  const extension = file.extension;
  const desiredPath = `${parentPath}/${newName}.${extension}`;

  const availablePath = await getAvailablePath(app, desiredPath);
  await app.fileManager.renameFile(file, availablePath);
}

export async function safeCopy(
  app: App,
  file: TFile,
  destinationPath: string
): Promise<TFile> {
  await ensureFolderExists(app, destinationPath);

  const desiredPath = `${destinationPath}/${file.name}`;
  const availablePath = await getAvailablePath(app, desiredPath);
  return await app.vault.copy(file, availablePath);
}

export async function safeMove(
  app: App,
  file: TFile,
  destinationPath: string
): Promise<void> {
  await ensureFolderExists(app, destinationPath);

  const desiredPath = `${destinationPath}/${file.name}`;
  const availablePath = await getAvailablePath(app, desiredPath);
  await app.fileManager.renameFile(file, availablePath);
}
/**
 * Sanitizes content to ensure it's valid for Obsidian
 * Handles frontmatter and content separately for safety
 */
export async function sanitizeContent(content: string): Promise<string> {
  try {
    // If content is empty or not a string, return empty string
    if (!content || typeof content !== "string") {
      return "";
    }

    const lines = content.split("\n");
    let inFrontmatter = false;
    let validContent: string[] = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // Handle frontmatter boundaries
      if (line.trim() === "---") {
        if (i === 0 || (i === 1 && !validContent.length)) {
          // Start of frontmatter
          inFrontmatter = true;
          validContent.push(line);
          continue;
        } else if (inFrontmatter) {
          // End of frontmatter
          inFrontmatter = false;
          validContent.push(line);
          continue;
        }
      }

      if (inFrontmatter) {
        // Validate frontmatter line
        try {
          // Check if line is valid YAML key-value pair
          const [key, ...valueParts] = line.split(":");
          if (key && key.trim() && !key.includes(" ")) {
            validContent.push(line);
          }
        } catch (e) {
          logger.debug("Skipping invalid frontmatter line:", line);
        }
      } else {
        // Regular content - remove null characters and other potentially problematic chars
        const sanitizedLine = line
          .replace(/\0/g, "") // Remove null characters
          .replace(/\u202E/g, "") // Remove RTL override characters
          .replace(/^\ufeff/g, "") // Remove BOM
          .replace(/\r/g, ""); // Normalize line endings

        validContent.push(sanitizedLine);
      }
    }

    // Ensure frontmatter is properly closed
    if (inFrontmatter) {
      validContent.push("---");
    }

    return validContent.join("\n");
  } catch (error) {
    logger.error("Error sanitizing content:", error);
    return content; // Return original content if sanitization fails
  }
}

/**
 * Safely modifies file content ensuring it's valid for Obsidian
 */
export async function safeModifyContent(
  app: App,
  file: TFile,
  content: string
): Promise<void> {
  try {
    const sanitizedContent = await sanitizeContent(content);

    // Check if content has frontmatter
    if (sanitizedContent.trim().startsWith("---")) {
      const parts = sanitizedContent.split(/^---\s*$/m);
      
      // Valid frontmatter should create 3 parts: ["", yaml content, remaining content]
      if (parts.length >= 3) {
        try {
          // Only try to parse the YAML part (index 1)
          parseYaml(parts[1]);
        } catch (e) {
          logger.debug("Frontmatter parsing failed, preserving original content");
          // Instead of stripping frontmatter, preserve the original content
          await app.vault.modify(file, sanitizedContent);
          return;
        }
      }
    }

    await app.vault.modify(file, sanitizedContent);
  } catch (error) {
    logger.error("Error in safeModifyContent:", error);
    throw error;
  }
}
