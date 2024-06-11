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

async function processFileV2(filePath: string, destinationFolderPath: string): Promise<FileMetadata> {
  const fileExtension = path.extname(filePath).slice(1);
  const fileName = path.basename(filePath, `.${fileExtension}`);
  const folderPath = path.dirname(filePath);
  const allFolders = await getAllFolders(destinationFolderPath); // Use destinationFolderPath here
  const text = await getTextFromFile(filePath);
  const model = ollama("dolphin-mistral");
  const suggestedFolder = await guessRelevantFolder(
    text,
    filePath,
    allFolders,
    model
  );

  const metadata: FileMetadata = {
    metadata: {
      content: text,
    },
    newName: fileName,
    newFolder: suggestedFolder,
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
  folderPath: string,
  destinationFolderPath: string
): Promise<void> {
  const files = await fs.promises.readdir(folderPath, { withFileTypes: true });

  for (const file of files) {
    if (file.name.startsWith(".")) {
      continue;
    }

    if (file.isFile()) {
      const filePath = path.join(folderPath, file.name);
      const metadata = await processFileV2(filePath, destinationFolderPath); // Pass it here
      console.log(metadata);
      await writeMetadataToFile(
        metadata,
        path.join(folderPath, "metadata.json")
      );

      const destinationFilePath = path.join(
        destinationFolderPath,
        metadata.newFolder,
        file.name
      );
      fs.copyFileSync(filePath, destinationFilePath);
    }
  }
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
