import { App, TFolder, TFile, normalizePath } from "obsidian";
import { FileOrganizerSettings } from "./FileOrganizerSettings";
import { Notice } from "obsidian";
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
  await ensureFolderExists(app, settings.stagingFolder);
  await ensureFolderExists(app, settings.backupFolderPath);
}

export async function checkAndCreateTemplates(
  app: App,
  settings: FileOrganizerSettings
) {
  const meetingNoteTemplatePath = `${settings.templatePaths}/meeting_note.md`;

  if (!(await app.vault.adapter.exists(meetingNoteTemplatePath))) {
    await app.vault.create(
      meetingNoteTemplatePath,
      `## Meeting Details

- Date: {{date}} in format YYYY-MM-DD
- Participants: {{participants}}

## Audio Reference

![[{{audio_file}}]]

## Key Points

[Summarize the main points discussed in the meeting]

## Action Items

- [ ] Action item 1
  - [ ] Sub-action 1.1
  - [ ] Sub-action 1.2
- [ ] Action item 2
  - [ ] Sub-action 2.1
  - [ ] Sub-action 2.2

## Detailed Notes

[Add your meeting notes here, maintaining a hierarchical structure]

## Transcription

[Insert the full transcription below]

---

AI Instructions:
1. Merge the transcription into the content, focusing on key points and action items.
2. Summarize the main discussion points in the "Key Points" section, using bullet points for clarity.
3. Extract and list any action items or tasks in the "Action Items" section:
   - Use a hierarchical structure with main action items and sub-actions.
   - Maintain the original level of detail from the transcript.
   - Use indentation to show the relationship between main actions and sub-actions.
4. In the "Detailed Notes" section, create a hierarchical structure that reflects the meeting's flow:
   - Use headings (###, ####) for main topics.
   - Use bullet points and sub-bullets for detailed points under each topic.
   - Preserve the granularity of the discussion, including specific examples or minor points.
5. Preserve the reference to the original audio file.
6. Maintain the overall structure of the note, including all headers and sections.
7. Delete transcription. Mention that it can be accessed in the Original file`
    );
  }
}

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
  const movedFile = app.vault.getAbstractFileByPath(normalizedFinalPath) as TFile;
  return movedFile;
}

export function isTFolder(file: any): file is TFolder {
  return file instanceof TFolder;
}

export function getAllFolders(app: App): string[] {
  const allFiles = app.vault.getAllLoadedFiles();
  const folderPaths = allFiles
    .filter((file) => isTFolder(file))
    .map((folder) => folder.path);

  return [...new Set(folderPaths)];
}
