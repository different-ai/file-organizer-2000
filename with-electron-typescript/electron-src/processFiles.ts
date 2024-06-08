// src/processFiles.ts
import fs from "fs";
import path from "path";
import { generateDocumentTitle, guessRelevantFolder } from "./aiService";
import { readdir } from "fs/promises";
import { ollama } from "ollama-ai-provider";

interface FileMetadata {
  newName: string;
  previousName: string;
  newFodler: string;
  previousFolder: string;
  metadata: {
    content: string;
  };
  shouldCreateNewFolder: boolean;
}

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
  const model = ollama("codellama:7b");
  const generatedName = await generateDocumentTitle(text, model);
  const suggestedFolder = await guessRelevantFolder(
    text,
    filePath,
    allFolders,
    model
  );
  const metadata: FileMetadata = {
    newName: generatedName,
    newFodler: suggestedFolder,
    metadata: {
      content: text,
    },
    previousFolder: folderPath,
    previousName: fileName,
    shouldCreateNewFolder: suggestedFolder === "None",
  };
  return metadata;
}

async function writeMetadataToFile(metadata: FileMetadata, outputPath: string) {
  const jsonString = JSON.stringify(metadata);
  await fs.promises.appendFile(outputPath, jsonString + "\n");
}

export async function processFiles(folderPath: string) {
  const files = await fs.promises.readdir(folderPath, { withFileTypes: true });
  for (const file of files) {
    // if dsstore ignore
    if (file.name === ".DS_Store") {
      continue;
    }
    
    // Check if the entry is a file
    if (file.isFile()) {
      const filePath = path.join(folderPath, file.name);
      const metadata = await processFileV2(filePath);
      console.log(metadata);
      await writeMetadataToFile(metadata, path.join(folderPath, "metadata.json"));
    }
  }
}

async function getAllFolders(folderPath: string): Promise<string[]> {
  const entries = await readdir(folderPath, { withFileTypes: true });
  const folders = [];
  for (const entry of entries) {
    if (entry.isDirectory()) {
      folders.push(entry.name);
    }
  }
  return folders;
}
