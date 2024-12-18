import { TFile, App } from "obsidian";
import { VALID_MEDIA_EXTENSIONS } from "../constants";

export function isMediaFile(file: TFile): boolean {
  return (
    VALID_MEDIA_EXTENSIONS.includes(file.extension) ||
    file.extension === "pdf"
  );
}

export function getFilePath(file: TFile): string {
  return file.path;
}

export function getFileName(file: TFile): string {
  return file.basename;
}

export function getFileExtension(file: TFile): string {
  return file.extension;
}

export async function ensureFolderExists(app: App, path: string): Promise<void> {
  const folderExists = await app.vault.adapter.exists(path);
  if (!folderExists) {
    await app.vault.createFolder(path);
  }
}

export function generateId(prefix: string = ''): string {
  return `${prefix}${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function getParentFolder(path: string): string {
  return path.split('/').slice(0, -1).join('/');
}

export function joinPaths(...parts: string[]): string {
  return parts.filter(Boolean).join('/');
}

export function getAttachmentPath(basePath: string, fileName: string): string {
  return joinPaths(basePath, 'attachments', fileName);
}

export function getContainerPath(basePath: string, fileName: string): string {
  return joinPaths(basePath, `${fileName}.md`);
} 