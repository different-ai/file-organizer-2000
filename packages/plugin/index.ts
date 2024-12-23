// import '../styles.css'; // Removed to prevent JS from injecting CSS

import {
  Plugin,
  Notice,
  TFolder,
  TFile,
  moment,
  normalizePath,
  loadPdfJs,
  arrayBufferToBase64,
} from "obsidian";
import { logMessage, sanitizeTag } from "./someUtils";
import { FileOrganizerSettingTab } from "./views/settings/view";
import {
  AssistantViewWrapper,
  ORGANIZER_VIEW_TYPE,
} from "./views/organizer/view";
import Jimp from "jimp/es/index";

import { FileOrganizerSettings, DEFAULT_SETTINGS } from "./settings";

import { registerEventHandlers } from "./handlers/eventHandlers";
import {
  initializeOrganizer,
  initializeFileOrganizationCommands,
} from "./handlers/commandHandlers";
import {
  ensureFolderExists,
  checkAndCreateFolders,
  checkAndCreateTemplates,
  moveFile,
} from "./fileUtils";

import { checkLicenseKey } from "./apiUtils";
import { makeApiRequest } from "./apiUtils";

import {
  VALID_IMAGE_EXTENSIONS,
  VALID_AUDIO_EXTENSIONS,
  VALID_MEDIA_EXTENSIONS,
} from "./constants";
import { initializeInboxQueue, Inbox } from "./inbox";
import { validateFile } from "./utils";
import { logger } from "./services/logger";
import { addTextSelectionContext } from "./views/ai-chat/use-context-items";

type TagCounts = {
  [key: string]: number;
};

export interface FolderSuggestion {
  isNewFolder: boolean;
  score: number;
  folder: string;
  reason: string;
}

// determine sever url
interface ProcessingResult {
  text: string;
  classification?: string;
  formattedText: string;
}

export interface FileMetadata {
  instructions: {
    shouldClassify: boolean;
    shouldAppendAlias: boolean;
    shouldAppendSimilarTags: boolean;
  };
  classification?: string;
  originalText: string;
  originalPath: string | undefined;
  originalName: string;
  aiFormattedText: string;
  newName: string;
  newPath: string;
  markAsProcessed: boolean;
  shouldCreateMarkdownContainer: boolean;
  aliases: string[];
  similarTags: string[];
}
interface TitleSuggestion {
  score: number;
  title: string;
  reason: string;
}

export default class FileOrganizer extends Plugin {
  public inbox: Inbox;
  settings: FileOrganizerSettings;

  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }

  async checkCatalystAccess(): Promise<boolean> {
    // fetch the file organizer premium status
    // if process env prod then point to prod server if not to localhost
    const serverUrl =
      process.env.NODE_ENV === "production"
        ? "https://app.fileorganizer2000.com"
        : this.getServerUrl();
    const premiumStatus = await fetch(`${serverUrl}/api/check-premium`, {
      headers: {
        Authorization: `Bearer ${this.settings.API_KEY}`,
      },
    });
    const { hasCatalystAccess } = await premiumStatus.json();
    return hasCatalystAccess;
  }

  async isLicenseKeyValid(key: string): Promise<boolean> {
    try {
      const isValid = await checkLicenseKey(this.getServerUrl(), key);

      this.settings.isLicenseValid = isValid;
      this.settings.API_KEY = key;
      await this.saveSettings();
      return isValid;
    } catch (error) {
      logger.error("Error checking API key:", error);
      this.settings.isLicenseValid = false;
      await this.saveSettings();
      return false;
    }
  }
  getServerUrl(): string {
    let serverUrl = this.settings.enableSelfHosting
      ? this.settings.selfHostingURL
      : "https://app.fileorganizer2000.com";

    // Remove trailing slash (/) at end of url if there is one; prevents errors for /api/chat requests
    serverUrl = serverUrl.replace(/\/$/, "");
    logMessage(`Using server URL: ${serverUrl}`);

    return serverUrl;
  }

  shouldCreateMarkdownContainer(file: TFile): boolean {
    return (
      VALID_MEDIA_EXTENSIONS.includes(file.extension) ||
      file.extension === "pdf"
    );
  }

  async identifyConceptsAndFetchChunks(content: string) {
    try {
      const response = await fetch(
        `${this.getServerUrl()}/api/concepts-and-chunks`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${this.settings.API_KEY}`,
          },
          body: JSON.stringify({ content }),
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const { concepts } = await response.json();
      return concepts;
    } catch (error) {
      logger.error("Error in identifyConceptsAndFetchChunks:", error);
      new Notice("An error occurred while processing the document.", 6000);
      throw error;
    }
  }

  async formatContentV2(
    content: string,
    formattingInstruction: string
  ): Promise<string> {
    try {
      const response = await fetch(`${this.getServerUrl()}/api/format`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.settings.API_KEY}`,
        },
        body: JSON.stringify({
          content,
          formattingInstruction,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const { content: formattedContent } = await response.json();
      return formattedContent;
    } catch (error) {
      logger.error("Error formatting content:", error);
      new Notice("An error occurred while formatting the content.", 6000);
      return "";
    }
  }

  async appendBackupLinkToCurrentFile(currentFile: TFile, backupFile: TFile) {
    const backupLink = `\n\n---\n[[${backupFile.path} | Link to original file]]`;

    await this.app.vault.append(currentFile, backupLink);
  }

  async getFormatInstruction(classification: string): Promise<string> {
    // get the template file from the classification
    const templateFile = this.app.vault.getAbstractFileByPath(
      `${this.settings.templatePaths}/${classification}`
    );
    if (!templateFile || !(templateFile instanceof TFile)) {
      logger.error("Template file not found or is not a valid file.");
      return "";
    }
    return await this.app.vault.read(templateFile);
  }
  async streamFormatInSplitView({
    file,
    formattingInstruction,
    content,
  }: {
    file: TFile;
    formattingInstruction: string;
    content: string;
  }): Promise<void> {
    try {
      new Notice("Formatting content in split view...", 3000);

      // Create a new file for the formatted content
      const newFileName = `${file.basename}-formatted-${Date.now()}.md`;
      const newFilePath = `${file.parent?.path}/${newFileName}`;
      const newFile = await this.app.vault.create(newFilePath, "");

      // Open the new file in a split view
      const leaf = this.app.workspace.splitActiveLeaf();
      await leaf.openFile(newFile);

      let formattedContent = "";
      const updateCallback = async (partialContent: string) => {
        formattedContent = partialContent;
        await this.app.vault.modify(newFile, formattedContent);
      };

      await this.formatStream(
        content,
        formattingInstruction,
        this.getServerUrl(),
        this.settings.API_KEY,
        updateCallback
      );

      new Notice("Content formatted in split view successfully", 3000);
    } catch (error) {
      logger.error("Error formatting content in split view:", error);
      new Notice(
        "An error occurred while formatting the content in split view.",
        6000
      );
    }
  }

  async streamFormatInCurrentNote({
    file,
    formattingInstruction,
    content,
  }: {
    file: TFile;
    formattingInstruction: string;
    content: string;
  }): Promise<void> {
    try {
      new Notice("Formatting content...", 3000);

      // Backup the file before formatting and get the backup file
      const backupFile = await this.backupTheFileAndAddReferenceToCurrentFile(
        file
      );

      let formattedContent = "";
      const updateCallback = async (partialContent: string) => {
        formattedContent = partialContent;
        await this.app.vault.modify(file, formattedContent);
      };

      await this.formatStream(
        content,
        formattingInstruction,
        this.getServerUrl(),
        this.settings.API_KEY,
        updateCallback
      );
      this.appendBackupLinkToCurrentFile(file, backupFile);

      new Notice("Content formatted successfully", 3000);
    } catch (error) {
      logger.error("Error formatting content:", error);
      new Notice("An error occurred while formatting the content.", 6000);
    }
  }

  async createFileInInbox(title: string, content: string): Promise<void> {
    const fileName = `${title}.md`;
    const filePath = `${this.settings.pathToWatch}/${fileName}`;
    await this.app.vault.create(filePath, content);
  }

  async extractTextFromPDF(file: TFile): Promise<string> {
    const pdfjsLib = await loadPdfJs(); // Ensure PDF.js is loaded
    try {
      const arrayBuffer = await this.app.vault.readBinary(file);
      const bytes = new Uint8Array(arrayBuffer);
      const doc = await pdfjsLib.getDocument({ data: bytes }).promise;
      let text = "";
      for (let pageNum = 1; pageNum <= Math.min(doc.numPages, 10); pageNum++) {
        const page = await doc.getPage(pageNum);
        const textContent = await page.getTextContent();
        text += textContent.items.map(item => item.str).join(" ");
      }
      return text;
    } catch (error) {
      logger.error(`Error extracting text from PDF: ${error}`);
      return "";
    }
  }

  async formatStream(
    content: string,
    formattingInstruction: string,
    serverUrl: string,
    apiKey: string,
    updateCallback: (partialContent: string) => void
  ): Promise<string> {
    const requestBody: any = {
      content,
      formattingInstruction,
      enableFabric: this.settings.enableFabric,
    };

    const response = await fetch(`${serverUrl}/api/format-stream`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      throw new Error(`Formatting failed: ${response.statusText}`);
    }

    const reader = response.body?.getReader();
    const decoder = new TextDecoder();
    let formattedContent = "";

    while (true) {
      const { done, value } = (await reader?.read()) ?? {
        done: true,
        value: undefined,
      };
      if (done) break;

      const chunk = decoder.decode(value, { stream: true });
      formattedContent += chunk;
      updateCallback(formattedContent);
    }

    return formattedContent;
  }

  async transcribeAudio(
    audioBuffer: ArrayBuffer,
    fileExtension: string
  ): Promise<Response> {
    const formData = new FormData();
    const blob = new Blob([audioBuffer], { type: `audio/${fileExtension}` });
    formData.append("audio", blob, `audio.${fileExtension}`);
    formData.append("fileExtension", fileExtension);
    // const newServerUrl = "http://localhost:3001/transcribe";
    const newServerUrl =
      "https://file-organizer-2000-audio-transcription.onrender.com/transcribe";

    const response = await fetch(newServerUrl, {
      method: "POST",
      body: formData,
      headers: {
        Authorization: `Bearer ${this.settings.API_KEY}`,
        // "Content-Type": "multipart/form-data",
      },
    });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Transcription failed: ${errorData.error}`);
    }
    return response;
  }

  async generateTranscriptFromAudio(
    file: TFile
  ): Promise<AsyncIterableIterator<string>> {
    try {
      const audioBuffer = await this.app.vault.readBinary(file);
      const response = await this.transcribeAudio(audioBuffer, file.extension);

      if (!response.body) {
        throw new Error("Response body is null");
      }

      const reader = response.body.getReader();

      async function* generateTranscript() {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          yield new TextDecoder().decode(value);
        }
      }

      return generateTranscript();
    } catch (e) {
      logger.error("Error generating transcript", e);
      new Notice("Error generating transcript", 3000);
      throw e;
    }
  }

  async classifyContentV2(
    content: string,
    classifications: string[]
  ): Promise<string> {
    const serverUrl = this.getServerUrl();
    const cutoff = this.settings.contentCutoffChars;
    const trimmedContent = content.slice(0, cutoff);
    const response = await fetch(`${serverUrl}/api/classify1`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.settings.API_KEY}`,
      },
      body: JSON.stringify({
        content: trimmedContent,
        templateNames: classifications,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const { documentType } = await response.json();
    return documentType;
  }

  async getTextFromFile(file: TFile): Promise<string> {
    switch (true) {
      case file.extension === "md":
        return await this.app.vault.read(file);
      case file.extension === "pdf": {
        const pdfContent = await this.extractTextFromPDF(file);
        return pdfContent;
      }
      case VALID_IMAGE_EXTENSIONS.includes(file.extension):
        return await this.generateImageAnnotation(file);
      case VALID_AUDIO_EXTENSIONS.includes(file.extension): {
        // Change this part to consume the iterator
        const transcriptIterator = await this.generateTranscriptFromAudio(file);
        let transcriptText = "";
        for await (const chunk of transcriptIterator) {
          transcriptText += chunk;
        }
        return transcriptText;
      }
      default:
        throw new Error(`Unsupported file type: ${file.extension}`);
    }
  }

  // adds an attachment to a file using the ![[attachment]] syntax
  async appendAttachment(markdownFile: TFile, attachmentFile: TFile) {
    await this.app.vault.append(
      markdownFile,
      `\n\n![[${attachmentFile.name}]]`
    );
  }
  async appendToFrontMatter(file: TFile, key: string, value: string) {
    await this.app.fileManager.processFrontMatter(file, frontmatter => {
      if (!frontmatter.hasOwnProperty(key)) {
        frontmatter[key] = [value];
      } else if (!Array.isArray(frontmatter[key])) {
        frontmatter[key] = [frontmatter[key], value];
      } else {
        frontmatter[key].push(value);
      }
    });
  }

  async checkAndCreateFolders() {
    await checkAndCreateFolders(this.app, this.settings);
  }

  async checkAndCreateTemplates() {
    await checkAndCreateTemplates(this.app, this.settings);
  }

  async ensureFolderExists(folderPath: string) {
    await ensureFolderExists(this.app, folderPath);
  }

  async moveFile(
    file: TFile,
    humanReadableFileName: string,
    destinationFolder = ""
  ) {
    return await moveFile(
      this.app,
      file,
      humanReadableFileName,
      destinationFolder
    );
  }
  // rn used to provide aichat contex
  getAllUserMarkdownFiles(): TFile[] {
    const settingsPaths = [
      this.settings.pathToWatch,
      this.settings.defaultDestinationPath,
      this.settings.attachmentsPath,
      this.settings.backupFolderPath,
    ];
    const allFiles = this.app.vault.getMarkdownFiles();
    // remove any file path that is part of the settingsPath
    const allFilesFiltered = allFiles.filter(
      file => !settingsPaths.some(path => file.path.includes(path))
    );

    return allFilesFiltered;
  }
  getAllIgnoredFolders(): string[] {
    const ignoredFolders = [
      ...this.settings.ignoreFolders,
      this.settings.defaultDestinationPath,
      this.settings.attachmentsPath,
      this.settings.backupFolderPath,
      this.settings.templatePaths,
      this.settings.fabricPaths,
      this.settings.pathToWatch,
      this.settings.errorFilePath,
      "_FileOrganizer2000",
      "/",
    ];
    logMessage("ignoredFolders", ignoredFolders);
    // remove empty strings
    return ignoredFolders.filter(folder => folder !== "");
  }
  // this is a list of all the folders that file organizer to use for organization
  getAllUserFolders(): string[] {
    const allFolders = this.app.vault.getAllFolders();
    const allFoldersPaths = allFolders.map(folder => folder.path);
    const ignoredFolders = this.getAllIgnoredFolders();

    // If ignoreFolders includes "*", return empty array as all folders are ignored
    if (this.settings.ignoreFolders.includes("*")) {
      return [];
    }

    return allFoldersPaths.filter(folder => {
      // Check if the folder is not in the ignored folders list
      return (
        !ignoredFolders.includes(folder) &&
        !ignoredFolders.some(ignoredFolder =>
          folder.startsWith(ignoredFolder + "/")
        )
      );
    });
  }

  async compressImage(fileContent: Buffer): Promise<Buffer> {
    const image = await Jimp.read(fileContent);

    // Check if the image is bigger than 1000 pixels in either width or height
    if (image.getWidth() > 1000 || image.getHeight() > 1000) {
      // Resize the image to a maximum of 1000x1000 while preserving aspect ratio
      image.scaleToFit(1000, 1000);
    }

    const resizedImage = await image.getBufferAsync(Jimp.MIME_PNG);
    return resizedImage;
  }

  isWebP(fileContent: Buffer): boolean {
    // Check if the file starts with the WebP signature
    return (
      fileContent.slice(0, 4).toString("hex") === "52494646" &&
      fileContent.slice(8, 12).toString("hex") === "57454250"
    );
  }

  async generateImageAnnotation(file: TFile) {
    const arrayBuffer = await this.app.vault.readBinary(file);
    const fileContent = Buffer.from(arrayBuffer);
    const imageSize = fileContent.byteLength;
    const imageSizeInMB2 = imageSize / (1024 * 1024);
    logMessage(`Image size: ${imageSizeInMB2.toFixed(2)} MB`);

    let processedArrayBuffer: ArrayBuffer;

    if (!this.isWebP(fileContent)) {
      // Compress the image if it's not a WebP
      const resizedImage = await this.compressImage(fileContent);
      processedArrayBuffer = resizedImage.buffer;
    } else {
      // If it's a WebP, use the original file content directly
      processedArrayBuffer = arrayBuffer;
    }

    const processedContent = await this.extractTextFromImage(
      processedArrayBuffer
    );

    return processedContent;
  }

  async extractTextFromImage(image: ArrayBuffer): Promise<string> {
    const base64Image = arrayBufferToBase64(image);

    const response = await fetch(`${this.getServerUrl()}/api/vision`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.settings.API_KEY}`,
      },
      body: JSON.stringify({
        image: base64Image,
        instructions: this.settings.imageInstructions,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const { text } = await response.json();
    return text;
  }

  async getBacklog() {
    const allFiles = this.app.vault.getFiles();
    const pendingFiles = allFiles.filter(file =>
      file.path.includes(this.settings.pathToWatch)
    );
    return pendingFiles;
  }
  async processBacklog() {
    const pendingFiles = await this.getBacklog();
    logMessage("Enqueuing files from backlog V3");
    Inbox.getInstance().enqueueFiles(pendingFiles);
    return;
  }

  async getAllVaultTags(): Promise<string[]> {
    // Fetch all tags from the vault
    // @ts-ignore
    const tags: TagCounts = this.app.metadataCache.getTags();

    // If no tags are found, return an empty array
    if (Object.keys(tags).length === 0) {
      logMessage("No tags found");
      return [];
    }

    // Sort tags by their occurrence count in descending order
    const sortedTags = Object.entries(tags).sort((a, b) => b[1] - a[1]);

    // Return the list of sorted tags
    return sortedTags.map(tag => tag[0]);
  }

  async recommendTags(
    content: string,
    filePath: string,
    existingTags: string[]
  ): Promise<
    Array<{ score: number; tag: string; reason: string; isNew: boolean }>
  > {
    const cutoff = this.settings.contentCutoffChars;
    const trimmedContent = content.slice(0, cutoff);

    const response = await fetch(`${this.getServerUrl()}/api/tags/v2`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.settings.API_KEY}`,
      },
      body: JSON.stringify({
        content: trimmedContent,
        fileName: filePath,
        existingTags,
        customInstructions: this.settings.customTagInstructions,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const { tags: suggestedTags } = await response.json();
    return suggestedTags;
  }

  async recommendFolders(
    content: string,
    fileName: string
  ): Promise<FolderSuggestion[]> {
    const customInstructions = this.settings.customFolderInstructions;
    const cutoff = this.settings.contentCutoffChars;
    const trimmedContent = content.slice(0, cutoff);

    const folders = this.getAllUserFolders();
    const response = await fetch(`${this.getServerUrl()}/api/folders/v2`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.settings.API_KEY}`,
      },
      body: JSON.stringify({
        content: trimmedContent,
        fileName: fileName,
        folders,
        customInstructions,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const { folders: suggestedFolders } = await response.json();
    return suggestedFolders;
  }

  async appendTag(file: TFile, tag: string) {
    // Ensure the tag starts with a hash symbol
    const formattedTag = sanitizeTag(tag);

    // Get the file content and metadata
    const fileContent = await this.app.vault.read(file);
    const metadata = this.app.metadataCache.getFileCache(file);

    // Check if tag exists in frontmatter
    const hasFrontmatterTag = metadata?.frontmatter?.tags?.includes(
      formattedTag.replace("#", "")
    );

    // Check if tag exists in content (for inline tags)
    const hasInlineTag = fileContent.includes(formattedTag);

    // If tag already exists, skip adding it
    if (hasFrontmatterTag || hasInlineTag) {
      return;
    }

    // Append similar tags
    if (this.settings.useSimilarTagsInFrontmatter) {
      await this.appendToFrontMatter(
        file,
        "tags",
        formattedTag.replace("#", "")
      );
      return;
    }

    await this.app.vault.append(file, `\n${formattedTag}`);
  }

  async ensureAssistantView(): Promise<AssistantViewWrapper | null> {
    // Try to find existing view
    let view = this.app.workspace.getLeavesOfType(ORGANIZER_VIEW_TYPE)[0]
      ?.view as AssistantViewWrapper;

    // If view doesn't exist, create it
    if (!view) {
      await this.app.workspace.getRightLeaf(false).setViewState({
        type: ORGANIZER_VIEW_TYPE,
        active: true,
      });

      // Get the newly created view
      view = this.app.workspace.getLeavesOfType(ORGANIZER_VIEW_TYPE)[0]
        ?.view as AssistantViewWrapper;
    }

    // Reveal and focus the leaf
    if (view) {
      this.app.workspace.revealLeaf(view.leaf);
    }

    return view;
  }

  async onload() {
    this.inbox = Inbox.initialize(this);
    await this.initializePlugin();
    logger.configure(this.settings.debugMode);

    await this.saveSettings();
    await ensureFolderExists(this.app, this.settings.logFolderPath);

    initializeInboxQueue(this);

    // Initialize different features
    initializeOrganizer(this);
    initializeFileOrganizationCommands(this);

    this.app.workspace.onLayoutReady(() => registerEventHandlers(this));
    this.processBacklog();

    this.addCommand({
      id: "open-organizer-tab",
      name: "Open Organizer Tab",
      callback: async () => {
        const view = await this.ensureAssistantView();
        view?.activateTab("organizer");
      },
    });

    this.addCommand({
      id: "open-inbox-tab",
      name: "Open Inbox Tab",
      callback: async () => {
        const view = await this.ensureAssistantView();
        view?.activateTab("inbox");
      },
    });

    this.addCommand({
      id: "open-chat-tab",
      name: "Open Chat Tab",
      callback: async () => {
        const view = await this.ensureAssistantView();
        view?.activateTab("chat");
      },
    });
    this.addCommand({
      id: "add-selection-to-chat",
      name: "Add Selection to Chat",
      editorCallback: async editor => {
        const selection = editor.getSelection();
        if (selection) {
          const activeFile = this.app.workspace.getActiveFile();
          const view = await this.ensureAssistantView();

          // Add the selection to context
          addTextSelectionContext({
            content: selection,
            sourceFile: activeFile?.path,
          });

          // Open chat tab
          view?.activateTab("chat");
        } else {
          new Notice("No text selected");
        }
      },
    });
  }
  async saveSettings() {
    await this.saveData(this.settings);
  }

  async initializePlugin() {
    await this.loadSettings();
    await this.checkAndCreateFolders();
    await this.checkAndCreateTemplates();
    this.addSettingTab(new FileOrganizerSettingTab(this.app, this));
  }

  async appendTranscriptToActiveFile(
    parentFile: TFile,
    audioFileName: string,
    transcriptIterator: AsyncIterableIterator<string>
  ) {
    const transcriptHeader = `\n\n## Transcript for ${audioFileName}\n\n`;
    await this.app.vault.append(parentFile, transcriptHeader);

    for await (const chunk of transcriptIterator) {
      await this.app.vault.append(parentFile, chunk);
      // Optionally, update UI or perform actions with each chunk
    }

    new Notice(`Transcription completed for ${audioFileName}`, 5000);
  }

  async generateUniqueBackupFileName(originalFile: TFile): Promise<string> {
    const baseFileName = `${originalFile.basename}_backup_${moment().format(
      "YYYYMMDD_HHmmss"
    )}`;
    let fileName = `${baseFileName}.${originalFile.extension}`;
    let counter = 1;

    while (
      await this.app.vault.adapter.exists(
        normalizePath(`${this.settings.backupFolderPath}/${fileName}`)
      )
    ) {
      fileName = `${baseFileName}_${counter}.${originalFile.extension}`;
      counter++;
    }

    return fileName;
  }

  async backupTheFileAndAddReferenceToCurrentFile(file: TFile): Promise<TFile> {
    const backupFileName = await this.generateUniqueBackupFileName(file);
    const backupFilePath = normalizePath(
      `${this.settings.backupFolderPath}/${backupFileName}`
    );

    // Create a backup of the file
    const backupFile = await this.app.vault.copy(file, backupFilePath);

    return backupFile;
  }

  async getTemplateInstructions(templateName: string): Promise<string> {
    const templateFolder = this.app.vault.getAbstractFileByPath(
      this.settings.templatePaths
    );
    if (!templateFolder || !(templateFolder instanceof TFolder)) {
      logger.error("Template folder not found or is not a valid folder.");
      return "";
    }
    // only look at files first
    const templateFile = templateFolder.children.find(
      file => file instanceof TFile && file.basename === templateName
    );
    if (!templateFile || !(templateFile instanceof TFile)) {
      logger.error("Template file not found or is not a valid file.");
      return "";
    }
    return await this.app.vault.read(templateFile);
  }
  // create a getTemplatesV2 that returns a list of template names only
  // and doesn't reuse getTemplates()
  async getTemplateNames(): Promise<string[]> {
    // get all file names in the template folder
    const templateFolder = this.app.vault.getAbstractFileByPath(
      this.settings.templatePaths
    );
    if (!templateFolder || !(templateFolder instanceof TFolder)) {
      logger.error("Template folder not found or is not a valid folder.");
      return [];
    }
    const templateFiles = templateFolder.children.filter(
      file => file instanceof TFile
    ) as TFile[];
    return templateFiles.map(file => file.basename);
  }

  async recommendName(
    content: string,
    fileName: string
  ): Promise<TitleSuggestion[]> {
    // cutoff
    const cutoff = this.settings.contentCutoffChars;
    const trimmedContent = content.slice(0, cutoff);

    const customInstructions = this.settings.renameInstructions;
    const response = await fetch(`${this.getServerUrl()}/api/title/v2`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.settings.API_KEY}`,
      },
      body: JSON.stringify({
        content: trimmedContent,
        fileName: fileName,
        customInstructions,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const { titles } = await response.json();
    return titles;
  }
}
