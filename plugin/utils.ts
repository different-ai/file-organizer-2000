import { TFile } from "obsidian";

import { Notice } from "obsidian";
import { isValidExtension } from "./constants";

export function arrayBufferToBase64(buffer: ArrayBuffer): string {
    let binary = "";
    const bytes = new Uint8Array(buffer);
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
  }

export function validateFile(file: TFile): boolean {
  if (!file.extension || !isValidExtension(file.extension)) {
    new Notice("Unsupported file type. Skipping.", 3000);
      return false;
    }
  return true;
}
