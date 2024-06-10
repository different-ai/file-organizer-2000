// electron-src/processFiles.ts
import fs from "fs";
import path from "path";
import { generateDocumentTitle, guessRelevantFolder } from "./aiService";
import { readdir } from "fs/promises";
import { ollama } from "ollama-ai-provider";
import { FileMetadata } from "./preload";
import { CONFIG_FOLDER_NAME } from ".";

async function getTextFromFile(filePath: string): Promise<string> {
  const fileContent = await fs.promises.readFile(filePath, "utf-8");
  return fileContent;
}

async function processFileV2(filePath: string): Promise<FileMetadata> {
  const fileExtension = path.extname(filePath).slice(1);
  const fileName = path.basename(filePath, `.${fileExtension}`);
  const folderPath = path.dirname(filePath);
  const allFolders = await getAllFolders(folderPath);
  const text = await getTextFromFile(filePath);
  const model = ollama("codegemma");
  const generatedName = await generateDocumentTitle(text, model);
  const suggestedFolder = await guessRelevantFolder(
    text,
    filePath,
    allFolders,
    model
  );
  const metadata: FileMetadata = {
    newName: generatedName,
    newFolder: suggestedFolder,
    metadata: {
      content: text,
    },
    shouldCreateNewFolder: suggestedFolder === "None",
    moved: false,
    originalFolder: folderPath,
    originalName: fileName,
  };
  return metadata;
}

async function writeMetadataToFile(metadata: FileMetadata, outputPath: string) {
  const jsonString = JSON.stringify(metadata);
  await fs.promises.appendFile(outputPath, jsonString + "\n");
}

export async function processFiles(
  folderPath: string
): Promise<FileMetadata[]> {
  const files = await fs.promises.readdir(folderPath, { withFileTypes: true });
  const allMetadata: FileMetadata[] = [];

  // Create the config folder if it doesn't exist
  const configFolderPath = path.join(folderPath, CONFIG_FOLDER_NAME);
  if (!fs.existsSync(configFolderPath)) {
    fs.mkdirSync(configFolderPath);
  }

  for (const file of files) {
    // Ignore dotfiles and dot folders
    if (file.name.startsWith(".")) {
      continue;
    }

    // Check if the entry is a file
    if (file.isFile()) {
      const filePath = path.join(folderPath, file.name);
      const metadata = await processFileV2(filePath);
      console.log(metadata);
      await writeMetadataToFile(
        metadata,
        path.join(folderPath, CONFIG_FOLDER_NAME, "metadata.json")
      );
      allMetadata.push(metadata);
    }
  }

  return allMetadata;
}

async function getAllFolders(folderPath: string): Promise<string[]> {
  const entries = await readdir(folderPath, { withFileTypes: true });
  const folders = [];
  for (const entry of entries) {
    if (entry.isDirectory() && !entry.name.startsWith(".")) {
      folders.push(entry.name);
    }
  }
  return folders;
}
