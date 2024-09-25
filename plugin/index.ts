import {
  Plugin,
  Notice,
  TFolder,
  TFile,
  TAbstractFile,
  moment,
  WorkspaceLeaf,
  normalizePath,
  loadPdfJs,
  requestUrl,
} from "obsidian";
import { logMessage, formatToSafeName, sanitizeTag } from "../utils";
import { FileOrganizerSettingTab } from "./views/configuration/tabs";
import {
  ASSISTANT_VIEW_TYPE,
  AssistantViewWrapper,
} from "./views/organizer";
import Jimp from "jimp";
import {
  FileOrganizerSettings,
  DEFAULT_SETTINGS,
} from "./settings";

import {
  classifyDocumentRouter,
  createNewFolderRouter,
  extractTextFromImageRouter,
  fetchChunksForConceptRouter,
  formatDocumentContentRouter,
  generateAliasVariationsRouter,
  generateDocumentTitleRouter,
  generateRelationshipsRouter,
  generateTagsRouter,
  guessRelevantFolderRouter,
  identifyConceptsAndFetchChunksRouter,
  identifyConceptsRouter,
} from "./aiServiceRouter";
import { registerEventHandlers } from "./handlers/eventHandlers";
import { registerCommandHandlers } from "./handlers/commandHandlers";
import {
  ensureFolderExists,
  checkAndCreateFolders,
  checkAndCreateTemplates,
  moveFile,
  getAllFolders,
} from "./fileUtils";
import { checkLicenseKey } from "./apiUtils";
import { AIChatView } from "./views/ai-chat/view";
import { makeApiRequest } from "./apiUtils";

type TagCounts = {
  [key: string]: number;
};

const validImageExtensions = ["png", "jpg", "jpeg", "gif", "svg", "webp"];
const validAudioExtensions = [
  "mp3",
  "mp4",
  "mpeg",
  "mpga",
  "m4a",
  "wav",
  "webm",
];
export const validMediaExtensions = [
  ...validImageExtensions,
  ...validAudioExtensions,
];
const validTextExtensions = ["md", "txt"];

const validExtensions = [
  ...validMediaExtensions,
  ...validTextExtensions,
  "pdf",
];

const isValidExtension = (extension: string) => {
  if (!validExtensions.includes(extension)) {
    new Notice("Sorry, FileOrganizer does not support this file type.");
    return false;
  }
  return true;
};
// determine sever url

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

export default class FileOrganizer extends Plugin {
  settings: FileOrganizerSettings;

  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }

  async isLicenseKeyValid(key: string): Promise<boolean> {
    try {
      const isValid = await checkLicenseKey(this.getServerUrl(), key);
      this.settings.isLicenseValid = isValid;
      this.settings.API_KEY = key;
      await this.saveSettings();
      return isValid;
    } catch (error) {
      console.error("Error checking API key:", error);
      this.settings.isLicenseValid = false;
      await this.saveSettings();
      return false;
    }
  }

  async checkLicenseOnLoad() {
    if (this.settings.isLicenseValid && this.settings.API_KEY) {
      await this.isLicenseKeyValid(this.settings.API_KEY);
    }
  }

  getServerUrl(): string {
    let serverUrl = this.settings.enableSelfHosting
      ? this.settings.selfHostingURL
      : "https://app.fileorganizer2000.com";

    // Remove trailing slash (/) at end of url if there is one; prevents errors for /api/chat requests
    serverUrl = serverUrl.replace(/\/$/, '');
    logMessage(`Using server URL: ${serverUrl}`);

    return serverUrl;
  }

  // all files in inbox will go through this function
  async processFileV2(originalFile: TFile, oldPath?: string): Promise<void> {
    try {
      new Notice(`Processing ${originalFile.basename}`, 3000);

      if (!originalFile.extension || !isValidExtension(originalFile.extension)) {
        new Notice("Unsupported file type. Skipping.", 3000);
        return;
      }

      await this.checkAndCreateFolders();

      let text: string;
      try {
        text = await this.getTextFromFile(originalFile);
      } catch (error) {
        new Notice(`Error reading file ${originalFile.basename}`, 3000);
        console.error(`Error in getTextFromFile:`, error);
        return;
      }

      let instructions: any;
      try {
        instructions = await this.generateInstructions(originalFile);
      } catch (error) {
        new Notice(`Error generating instructions for ${originalFile.basename}`, 3000);
        console.error(`Error in generateInstructions:`, error);
        return;
      }

      let metadata: any;
      try {
        metadata = await this.generateMetadata(
          originalFile,
          instructions,
          text,
          oldPath
        );
      } catch (error) {
        new Notice(`Error generating metadata for ${originalFile.basename}`, 3000);
        console.error(`Error in generateMetadata:`, error);
        return;
      }

      try {
        await this.executeInstructions(metadata, originalFile, text);
      } catch (error) {
        new Notice(`Error executing instructions for ${originalFile.basename}`, 3000);
        console.error(`Error in executeInstructions:`, error);
      }
    } catch (error) {
      new Notice(`Unexpected error processing ${originalFile.basename}`, 3000);
      console.error(`Error in processFileV2:`, error);
    }
  }

  async generateInstructions(
    file: TFile
  ): Promise<FileMetadata["instructions"]> {
    const shouldClassify = this.settings.enableDocumentClassification;
    const shouldAppendAlias = this.settings.enableAliasGeneration;
    const shouldAppendSimilarTags = this.settings.useSimilarTags;

    return {
      shouldClassify,
      shouldAppendAlias,
      shouldAppendSimilarTags,
    };
  }

  async generateMetadata(
    file: TFile,
    instructions: FileMetadata["instructions"],
    textToFeedAi: string,
    oldPath?: string
  ): Promise<FileMetadata> {
    const documentName = await this.generateNameFromContent(
      textToFeedAi,
      file.basename
    );

    const classificationResult = instructions.shouldClassify
      ? await this.classifyAndFormatDocumentV2(file, textToFeedAi)
      : null;

    const classification = classificationResult?.type;
    const aiFormattedText = classificationResult?.formattedText || "";

    // Determine the folder path based on formatted content (if available) or original content
    const newPath = await this.getAIClassifiedFolder(
      classification && aiFormattedText ? aiFormattedText : textToFeedAi,
      file.path
    );

    const aliases = instructions.shouldAppendAlias
      ? await this.generateAliasses(documentName, textToFeedAi)
      : [];

    const similarTags = instructions.shouldAppendSimilarTags
      ? await this.getSimilarTags(textToFeedAi, documentName,)
      : [];

    return {
      instructions,
      classification,
      originalText: textToFeedAi,
      originalPath: oldPath,
      originalName: file.basename,
      aiFormattedText,
      shouldCreateMarkdownContainer:
        validMediaExtensions.includes(file.extension) ||
        file.extension === "pdf",
      markAsProcessed: true,
      newName: documentName,
      newPath,
      aliases,
      similarTags,
    };
  }

  async identifyConceptsAndFetchChunks(content: string) {
    try {
      const result = await identifyConceptsAndFetchChunksRouter(
        content,
        this.settings.usePro,
        this.getServerUrl(),
        this.settings.API_KEY
      );
      return result;
    } catch (error) {
      console.error("Error in identifyConceptsAndFetchChunks:", error);
      new Notice("An error occurred while processing the document.", 6000);
      throw error;
    }
  }

  async retrieveFileToModify(originalFile: TFile, isMedia: boolean) {
    if (isMedia) {
      this.appendToCustomLogFile(`Created markdown find to annotate media`);
      return await this.app.vault.create(
        `${this.settings.defaultDestinationPath}/${originalFile.basename}.md`,
        ""
      );
    }

    return originalFile;
  }

  async executeInstructions(
    metadata: FileMetadata,
    fileBeingProcessed: TFile,
    text: string
  ): Promise<void> {
    // Create a new markdown file in default folder
    const fileToOrganize = await this.retrieveFileToModify(
      fileBeingProcessed,
      metadata.shouldCreateMarkdownContainer
    );

    // If it's a brand new markdown file it should be annotated
    if (metadata.shouldCreateMarkdownContainer) {
      await this.app.vault.modify(fileToOrganize, text);
      this.appendToCustomLogFile(
        `Annotated ${metadata.shouldCreateMarkdownContainer ? "media" : "file"
        } [[${metadata.newName}]]`
      );
    }

    // If it should be classified/formatted
    if (metadata.instructions.shouldClassify && metadata.classification) {
      const backupFile = await this.backupTheFileAndAddReferenceToCurrentFile(
        fileToOrganize
      );
      await this.app.vault.modify(fileToOrganize, metadata.aiFormattedText);
      await this.appendBackupLinkToCurrentFile(fileToOrganize, backupFile);

      this.appendToCustomLogFile(
        `Classified [[${metadata.newName}]] as ${metadata.classification} and formatted it with [[${this.settings.templatePaths}/${metadata.classification}]]`
      );
    }

    // append the attachment as a reference to audio, image, or pdf files.
    if (metadata.shouldCreateMarkdownContainer) {
      const mediaFile = fileBeingProcessed;
      await this.moveToAttachmentFolder(mediaFile, metadata.newName);
      this.appendToCustomLogFile(
        `Moved [[${mediaFile.basename}.${mediaFile.extension}]] to attachments folders`
      );
      await this.appendAttachment(fileToOrganize, mediaFile);
      this.appendToCustomLogFile(`Added attachment to [[${metadata.newName}]]`);
    }

    // Move the file to its new location
    await this.moveFile(fileToOrganize, metadata.newName, metadata.newPath);
    this.appendToCustomLogFile(
      `Renamed ${metadata.originalName} to [[${fileToOrganize.basename}]]`
    );
    this.appendToCustomLogFile(
      `Organized [[${fileToOrganize.basename}]] into ${metadata.newPath}`
    );

    // Handle similar tags
    if (
      metadata.instructions.shouldAppendSimilarTags &&
      metadata.similarTags.length > 0
    ) {
      for (const tag of metadata.similarTags) {
        await this.appendTag(fileToOrganize, tag);
      }
      this.appendToCustomLogFile(
        `Appended similar tags to [[${fileToOrganize.basename}]]`
      );
    }
  }

  async generateAliasses(name: string, content: string): Promise<string[]> {
    return await generateAliasVariationsRouter(
      name,
      content,
      this.settings.usePro,
      this.getServerUrl(),
      this.settings.API_KEY
    );
  }



  async formatContentV2(
    file: TFile,
    content: string,
    formattingInstruction: string
  ): Promise<string> {
    try {
      const formattedContent = await formatDocumentContentRouter(
        content,
        formattingInstruction,
        this.settings.usePro,
        this.getServerUrl(),
        this.settings.API_KEY
      );
      return formattedContent;
    } catch (error) {
      console.error("Error formatting content:", error); // Added error logging
      new Notice("An error occurred while formatting the content.", 6000); // Added user notice
    }
    return "";
  }
  async classifyAndFormatDocumentV2(file: TFile, content: string) {
    try {
      const classification = await this.classifyContent(content, file.basename);
      if (classification) {
        const formattedText = await this.formatContentV2(
          file,
          content,
          classification.formattingInstruction
        );
        return {
          type: classification.type,
          formattingInstruction: classification.formattingInstruction,
          formattedText,
        };
      }
      return null;
    } catch (error) {
      console.error("Error in classifyAndFormatDocumentV2:", error);
      new Notice(
        "An error occurred while classifying and formatting the document.",
        6000
      );
      return null;
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
      console.error("Template file not found or is not a valid file.");
      return "";
    }
    return await this.app.vault.read(templateFile);
  }

  async formatContent(
    // make this an object
    {
      file,
      formattingInstruction,
      content,
    }: {
      file: TFile;
      formattingInstruction: string;
      content: string;
    }
  ): Promise<void> {
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
      console.error("Error formatting content:", error);
      new Notice("An error occurred while formatting the content.", 6000);
    }
  }
  async createFileInInbox(content: string): Promise<void> {
    const fileName = `chunk_${Date.now()}.md`;
    const filePath = `${this.settings.pathToWatch}/${fileName}`;
    await this.app.vault.create(filePath, content);
    await this.processFileV2(
      this.app.vault.getAbstractFileByPath(filePath) as TFile
    );
  }

  async identifyConcepts(content: string): Promise<string[]> {
    return await identifyConceptsRouter(
      content,
      this.settings.usePro,
      this.getServerUrl(),
      this.settings.API_KEY
    );
  }

  async fetchChunkForConcept(
    content: string,
    concept: string
  ): Promise<{ content: string }> {
    return await fetchChunksForConceptRouter(
      content,
      concept,
      this.settings.usePro,
      this.getServerUrl(),
      this.settings.API_KEY
    );
  }
  // we use this to keep track if we have already processed a file vs not
  // to indicate it to our users (aka they won't need to send it to inbox again)
  async tagAsProcessed(file: TFile) {
    if (!this.settings.processedTag) {
      return;
    }
    const tag = "#fo2k";
    this.appendTag(file, tag);
  }

  async getClassifications(): Promise<
    { type: string; formattingInstruction: string }[]
  > {
    const templateFolder = this.app.vault.getAbstractFileByPath(
      this.settings.templatePaths
    );

    if (!templateFolder || !(templateFolder instanceof TFolder)) {
      console.error("Template folder not found or is not a valid folder.");
      return [];
    }

    const templateFiles: TFile[] = templateFolder.children.filter(
      file => file instanceof TFile
    ) as TFile[];

    const classifications = await Promise.all(
      templateFiles.map(async file => ({
        type: file.basename,
        formattingInstruction: await this.app.vault.read(file),
      }))
    );

    return classifications;
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
      console.error(`Error extracting text from PDF: ${error}`);
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

  async readPatternFiles(patternName: string): Promise<{ systemContent: string, userContent: string }> {
    const patternDir = this.app.vault.getAbstractFileByPath(`_FileOrganizer2000/patterns/${patternName}`);
    if (!(patternDir instanceof TFolder)) {
      throw new Error(`Pattern directory not found: ${patternName}`);
    }

    const systemFile = patternDir.children.find(file => file.name === "system.md");
    const userFile = patternDir.children.find(file => file.name === "user.md");

    if (!(systemFile instanceof TFile) || !(userFile instanceof TFile)) {
      throw new Error(`Missing system.md or user.md in pattern: ${patternName}`);
    }

    const systemContent = await this.app.vault.read(systemFile);
    const userContent = await this.app.vault.read(userFile);

    return { systemContent, userContent };
  }

  async transcribeAudio(
    audioBuffer: ArrayBuffer,
    fileExtension: string,
    {
      usePro,
      serverUrl,
      fileOrganizerApiKey,
      openAIApiKey,
    }: {
      usePro: boolean;
      serverUrl: string;
      fileOrganizerApiKey: string;
      openAIApiKey: string;
    }
  ): Promise<Response> {
    const formData = new FormData();
    const blob = new Blob([audioBuffer], { type: `audio/${fileExtension}` });
    formData.append("audio", blob, `audio.${fileExtension}`);
    formData.append("fileExtension", fileExtension);
    // const newServerUrl = "http://localhost:3001/transcribe";
    const newServerUrl =
      "https://file-organizer-2000-x.onrender.com/transcribe";
    const response = await fetch(newServerUrl, {
      method: "POST",
      body: formData,
      headers: {
        Authorization: `Bearer ${fileOrganizerApiKey}`,
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
    new Notice(
      `Generating transcription for ${file.basename}. This may take a few minutes.`,
      8000
    );
    try {
      const audioBuffer = await this.app.vault.readBinary(file);
      const response = await this.transcribeAudio(audioBuffer, file.extension, {
        usePro: this.settings.usePro,
        serverUrl: this.getServerUrl(),
        fileOrganizerApiKey: this.settings.API_KEY,
        openAIApiKey: this.settings.openAIApiKey,
      });

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

      new Notice(`Transcription started for ${file.basename}`, 5000);
      return generateTranscript();
    } catch (e) {
      console.error("Error generating transcript", e);
      new Notice("Error generating transcript", 3000);
      throw e;
    }
  }
  getClassificationsForFabric(): string[] {
    const patternFolder = this.app.vault.getAbstractFileByPath(
      '_FileOrganizer2000/patterns'
    );
    if (!patternFolder || !(patternFolder instanceof TFolder)) {
      console.error("Pattern folder not found or is not a valid folder.");
      return [];
    }
    const patternFolders = patternFolder.children.filter(file => file instanceof TFolder).map(folder => folder.name);
    return patternFolders;
  }

  async classifyContentV2(content: string, classifications: string[]): Promise<string> {
    const serverUrl = this.getServerUrl();
    try {
      const response = await fetch(`${serverUrl}/api/classify1`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${this.settings.API_KEY}`
        },
        body: JSON.stringify({
          content,
          templateNames: classifications,
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const { documentType } = await response.json();
      return documentType;
    } catch (error) {
      console.error("Error in classifyContentV2:", error);
      throw error;
    }
  }

  // @deprecated use classifyContentV2 instead
  async classifyContent(
    content: string,
    name: string
  ): Promise<{ type: string; formattingInstruction: string } | null> {
    const classifications = await this.getClassifications();
    const templateNames = classifications.map(c => c.type);

    const documentType = await classifyDocumentRouter(
      content,
      name,
      templateNames,
      this.settings.usePro,
      this.getServerUrl(),
      this.settings.API_KEY
    );

    logMessage("documentType", documentType);

    const selectedClassification = classifications.find(
      c => c.type.toLowerCase() === documentType.toLowerCase()
    );

    if (selectedClassification) {
      return {
        type: selectedClassification.type,
        formattingInstruction: selectedClassification.formattingInstruction,
      };
    }

    return null;
  }

  /* experimental above until further notice */

  async organizeFile(file: TFile, content: string) {
    const destinationFolder = await this.getAIClassifiedFolder(
      content,
      file.path
    );
    new Notice(`Most similar folder: ${destinationFolder}`, 3000);
    await this.moveFile(file, file.basename, destinationFolder);
  }



  async showAssistantSidebar() {
    this.app.workspace.detachLeavesOfType(ASSISTANT_VIEW_TYPE);

    await this.app.workspace.getRightLeaf(false).setViewState({
      type: ASSISTANT_VIEW_TYPE,
      active: true,
    });

    this.app.workspace.revealLeaf(
      this.app.workspace.getLeavesOfType(ASSISTANT_VIEW_TYPE)[0]
    );
  }

  async getTextFromFile(file: TFile): Promise<string> {
    switch (true) {
      case file.extension === "md":
        return await this.app.vault.read(file);
      case file.extension === "pdf": {
        const pdfContent = await this.extractTextFromPDF(file);
        return pdfContent;
      }
      case validImageExtensions.includes(file.extension):
        return await this.generateImageAnnotation(file);
      case validAudioExtensions.includes(file.extension):
        return await this.generateTranscriptFromAudio(file);
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

  async appendAlias(file: TFile, alias: string) {
    this.appendToFrontMatter(file, "aliases", alias);
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

  getAllFolders(): string[] {
    const allFolders = getAllFolders(this.app);

    // if ignoreFolders includes * then return all folders
    if (this.settings.ignoreFolders.includes("*")) {
      return [];
    }

    return allFolders
      .filter(folder => !this.settings.ignoreFolders.includes(folder))
      .filter(folder => folder !== this.settings.pathToWatch)
      .filter(folder => folder !== this.settings.defaultDestinationPath)
      .filter(folder => folder !== this.settings.attachmentsPath)
      .filter(folder => folder !== this.settings.backupFolderPath)
      .filter(folder => folder !== this.settings.templatePaths);
  }

  async getSimilarFiles(fileToCheck: TFile): Promise<string[]> {
    if (!fileToCheck) {
      return [];
    }

    const activeFileContent = await this.app.vault.read(fileToCheck);
    logMessage("activeFileContent", activeFileContent);
    const settingsPaths = [
      this.settings.pathToWatch,
      this.settings.defaultDestinationPath,
      this.settings.attachmentsPath,
      this.settings.logFolderPath,
      this.settings.templatePaths,
    ];
    const allFiles = this.app.vault.getMarkdownFiles();
    // remove any file path that is part of the settingsPath
    const allFilesFiltered = allFiles.filter(
      file =>
        !settingsPaths.some(path => file.path.includes(path)) &&
        file.path !== fileToCheck.path
    );

    const fileContents = allFilesFiltered.map(file => ({
      name: file.path,
    }));

    const similarFiles = await generateRelationshipsRouter(
      activeFileContent,
      fileContents,
      this.settings.usePro,
      this.getServerUrl(),
      this.settings.API_KEY
    );

    return similarFiles.filter(
      (file: string) =>
        !settingsPaths.some(path => file.includes(path)) &&
        !this.settings.ignoreFolders.includes(file)
    );
  }

  async moveToAttachmentFolder(file: TFile, newFileName: string) {
    const destinationFolder = this.settings.attachmentsPath;
    return await this.moveFile(file, newFileName, destinationFolder);
  }

  async generateNameFromContent(
    content: string,
    currentName: string
  ): Promise<string> {
    if (!this.settings.enableFileRenaming) {
      return currentName; // Return the current name if renaming is disabled
    }

    const renameInstructions = this.settings.renameInstructions;
    logMessage("renameInstructions", renameInstructions);
    const name = await generateDocumentTitleRouter(
      content,
      currentName,
      this.settings.usePro,
      this.getServerUrl(),
      this.settings.API_KEY,
      renameInstructions
    );
    return formatToSafeName(name);
  }


  // get random titles from the users vault to get better titles suggestions
  getRandomVaultTitles(count: number): string[] {
    const allFiles = this.app.vault.getFiles();
    const filteredFiles = allFiles.filter(file =>
      file.extension === "md" &&
      !file.basename.toLowerCase().includes("untitled") &&
      !file.basename.toLowerCase().includes("backup") &&
      !file.path.includes(this.settings.backupFolderPath)
    );
    const shuffled = filteredFiles.sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count).map(file => file.basename);
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

  // main.ts
  async generateImageAnnotation(file: TFile,) {
    new Notice(
      `Generating annotation for ${file.basename} this can take up to a minute`,
      8000
    );

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

    const processedContent = await extractTextFromImageRouter(
      processedArrayBuffer,
      this.settings.usePro,
      this.getServerUrl(),
      this.settings.API_KEY
    );

    return processedContent;
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
    for (const file of pendingFiles) {
      await this.processFileV2(file);
    }
  }
  async getSimilarTags(content: string, fileName: string): Promise<string[]> {
    const tags: string[] = await this.getAllVaultTags();

    if (tags.length === 0) {
      console.info("No tags found");
      return [];
    }

    // Generate popular tags and select from them
    return await generateTagsRouter(
      content,
      fileName,
      tags,
      this.settings.usePro,
      this.getServerUrl(),
      this.settings.API_KEY
    );
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

  isTFolder(file: TAbstractFile): file is TFolder {
    return file instanceof TFolder;
  }

  async getAIClassifiedFolder(
    content: string,
    filePath: string
  ): Promise<string> {
    let destinationFolder = "None";

    const uniqueFolders = await this.getAllFolders();
    logMessage("uniqueFolders", uniqueFolders);

    logMessage("ignore folders", this.settings.ignoreFolders);

    if (this.settings.ignoreFolders.includes("*")) {
      return this.settings.defaultDestinationPath;
    }

    const filteredFolders = uniqueFolders
      .filter(folder => folder !== filePath)
      .filter(folder => folder !== this.settings.defaultDestinationPath)
      .filter(folder => folder !== this.settings.attachmentsPath)
      .filter(folder => folder !== this.settings.logFolderPath)
      .filter(folder => folder !== this.settings.pathToWatch)
      .filter(folder => folder !== this.settings.templatePaths)
      .filter(folder => !folder.includes("_FileOrganizer2000"))
      // if  this.settings.ignoreFolders has one or more folder specified, filter them out including subfolders
      .filter(folder => {
        const hasIgnoreFolders =
          this.settings.ignoreFolders.length > 0 &&
          this.settings.ignoreFolders[0] !== "";
        if (!hasIgnoreFolders) return true;
        const isFolderIgnored = this.settings.ignoreFolders.some(ignoreFolder =>
          folder.startsWith(ignoreFolder)
        );
        return !isFolderIgnored;
      })
      .filter(folder => folder !== "/");
    logMessage("filteredFolders", filteredFolders);
    const guessedFolder = await guessRelevantFolderRouter(
      content,
      filePath,
      filteredFolders,
      this.getServerUrl(),
      this.settings.API_KEY
    );

    if (guessedFolder === null || guessedFolder === "null") {
      logMessage("no good folder, creating a new one instead");
      const newFolderName = await createNewFolderRouter(
        content,
        filePath,
        filteredFolders,
        this.settings.usePro,
        this.getServerUrl(),
        this.settings.API_KEY
      );
      destinationFolder = newFolderName;
    } else {
      destinationFolder = guessedFolder;
    }
    return destinationFolder;
  }


  async appendTag(file: TFile, tag: string) {
    // Ensure the tag starts with a hash symbol
    const formattedTag = sanitizeTag(tag);
    // Append similar tags
    if (this.settings.useSimilarTagsInFrontmatter) {
      await this.appendToFrontMatter(file, "tags", formattedTag);
      return;
    }
    await this.app.vault.append(file, `\n${formattedTag}`);
  }

  async appendSimilarTags(content: string, file: TFile) {
    // Get similar tags
    const similarTags = await this.getSimilarTags(content, file.basename);

    if (similarTags.length === 0) {
      new Notice(`No similar tags found`, 3000);
      return;
    }
    similarTags.forEach(async tag => {
      await this.appendTag(file, tag);
    });

    await this.appendToCustomLogFile(
      `Added similar tags to [[${file.basename}]]`
    );
    new Notice(`Added similar tags to ${file.basename}`, 3000);
    return;
  }

  async appendToCustomLogFile(contentToAppend: string, action = "") {
    if (!this.settings.useLogs) {
      return;
    }
    const now = new Date();
    const formattedDate = moment(now).format("YYYY-MM-DD");
    const logFilePath = `${this.settings.logFolderPath}/${formattedDate}..md`;
    // if does not exist create it
    if (!(await this.app.vault.adapter.exists(normalizePath(logFilePath)))) {
      await this.app.vault.create(logFilePath, "");
    }

    const logFile = this.app.vault.getAbstractFileByPath(logFilePath);
    if (!(logFile instanceof TFile)) {
      throw new Error(`File with path ${logFilePath} is not a markdown file`);
    }

    const formattedTime =
      now.getHours().toString().padStart(2, "0") +
      ":" +
      now.getMinutes().toString().padStart(2, "0");
    const contentWithLink = `\n - ${formattedTime} ${contentToAppend}`;
    await this.app.vault.append(logFile, contentWithLink);
  }

  validateAPIKey() {
    if (!this.settings.usePro) {
      // atm we assume no api auth for self hosted
      return true;
    }

    if (!this.settings.API_KEY) {
      throw new Error(
        "Please enter your API Key in the settings of the FileOrganizer plugin."
      );
    }
  }

  async onload() {
    await this.initializePlugin();

    this.addRibbonIcon("sparkle", "Fo2k Assistant View", () => {
      this.showAssistantSidebar();
    });

    // Register command handlers
    registerCommandHandlers(this);

    this.app.workspace.onLayoutReady(() => registerEventHandlers(this));
    this.processBacklog();
  }
  async saveSettings() {
    await this.saveData(this.settings);
  }

  async initializeChat() {
    this.addRibbonIcon("bot", "Fo2k Chat", () => {
      this.activateView();
    });

    this.registerView("ai-chat-view", leaf => new AIChatView(leaf, this));

    this.addCommand({
      id: "open-ai-chat",
      name: "Fo2k Open AI Chat",
      callback: () => {
        this.activateView();
      },
    });
  }

  async activateView() {
    const { workspace } = this.app;

    let leaf: WorkspaceLeaf | null = null;
    const leaves = workspace.getLeavesOfType("ai-chat-view");

    if (leaves.length > 0) {
      leaf = leaves[0];
    } else {
      leaf = workspace.getRightLeaf(false);
      await leaf.setViewState({ type: "ai-chat-view", active: true });
    }

    if (leaf) {
      workspace.revealLeaf(leaf);
    }
  }

  async initializePlugin() {
    await this.loadSettings();
    await this.checkAndCreateFolders();
    await this.checkAndCreateTemplates();
    await this.initializeChat();
    this.addSettingTab(new FileOrganizerSettingTab(this.app, this));
    this.registerView(
      ASSISTANT_VIEW_TYPE,
      (leaf: WorkspaceLeaf) => new AssistantViewWrapper(leaf, this)
    );
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

  async getTemplates(): Promise<{ type: string; formattingInstruction: string }[]> {

    const templateFolder = this.app.vault.getAbstractFileByPath(this.settings.templatePaths);

    if (!templateFolder || !(templateFolder instanceof TFolder)) {
      console.error("Template folder not found or is not a valid folder.");
      return [];
    }


    const templateFiles = templateFolder.children.filter(file => file instanceof TFile) as TFile[];

    const templates = await Promise.all(
      templateFiles.map(async file => ({
        type: file.basename,
        formattingInstruction: await this.app.vault.read(file)
      }))
    );

    return templates;
  }

  async getExistingFolders(content: string, filePath: string): Promise<string[]> {
    const uniqueFolders = await this.getAllFolders();
    if (this.settings.ignoreFolders.includes("*")) {
      return [this.settings.defaultDestinationPath];
    }
    const currentFolder = this.app.vault.getAbstractFileByPath(filePath)?.parent?.path || '';
    const filteredFolders = uniqueFolders
      .filter(folder => folder !== currentFolder)
      .filter(folder => folder !== filePath)
      .filter(folder => folder !== this.settings.defaultDestinationPath)
      .filter(folder => folder !== this.settings.attachmentsPath)
      .filter(folder => folder !== this.settings.logFolderPath)
      .filter(folder => folder !== this.settings.pathToWatch)
      .filter(folder => folder !== this.settings.templatePaths)
      .filter(folder => !folder.includes("_FileOrganizer2000"))
      // if  this.settings.ignoreFolders has one or more folder specified, filter them out including subfolders
      .filter(folder => {
        const hasIgnoreFolders =
          this.settings.ignoreFolders.length > 0 &&
          this.settings.ignoreFolders[0] !== "";
        if (!hasIgnoreFolders) return true;
        const isFolderIgnored = this.settings.ignoreFolders.some(ignoreFolder =>
          folder.startsWith(ignoreFolder)
        );
        return !isFolderIgnored;
      })
      .filter(folder => folder !== "/");

    try {
      const apiEndpoint = this.settings.useFolderEmbeddings
        ? '/api/folders/embeddings'
        : '/api/folders/existing';

      const response = await makeApiRequest(() =>
        requestUrl({
          url: `${this.getServerUrl()}${apiEndpoint}`,
          method: "POST",
          contentType: "application/json",
          body: JSON.stringify({
            content,
            fileName: filePath,
            folders: filteredFolders,
          }),
          throw: false,
          headers: {
            Authorization: `Bearer ${this.settings.API_KEY}`
          },
        })
      );
      const { folders: guessedFolders } = await response.json;
      return guessedFolders

    } catch (error) {
      console.error("Error in getExistingFolders:", error);
      return [this.settings.defaultDestinationPath];
    }
  }
  async getNewFolders(content: string, filePath: string): Promise<string[]> {
    const uniqueFolders = await this.getAllFolders();
    if (this.settings.ignoreFolders.includes("*")) {
      return [this.settings.defaultDestinationPath];
    }
    const currentFolder = this.app.vault.getAbstractFileByPath(filePath)?.parent?.path || '';
    const filteredFolders = uniqueFolders
      .filter(folder => folder !== currentFolder)
      .filter(folder => folder !== filePath)
      .filter(folder => folder !== this.settings.defaultDestinationPath)
      .filter(folder => folder !== this.settings.attachmentsPath)
      .filter(folder => folder !== this.settings.logFolderPath)
      .filter(folder => folder !== this.settings.pathToWatch)
      .filter(folder => folder !== this.settings.templatePaths)
      .filter(folder => !folder.includes("_FileOrganizer2000"))
      // if  this.settings.ignoreFolders has one or more folder specified, filter them out including subfolders
      .filter(folder => {
        const hasIgnoreFolders =
          this.settings.ignoreFolders.length > 0 &&
          this.settings.ignoreFolders[0] !== "";
        if (!hasIgnoreFolders) return true;
        const isFolderIgnored = this.settings.ignoreFolders.some(ignoreFolder =>
          folder.startsWith(ignoreFolder)
        );
        return !isFolderIgnored;
      })
      .filter(folder => folder !== "/");
    try {
      const response = await makeApiRequest(() =>
        requestUrl({
          url: `${this.getServerUrl()}/api/folders/new`,
          method: "POST",
          contentType: "application/json",
          body: JSON.stringify({
            content,
            fileName: filePath,
            folders: filteredFolders,
          }),
          throw: false,
          headers: {
            Authorization: `Bearer ${this.settings.API_KEY}`
          },
        })
      );
      const { folders: guessedFolders } = await response.json;
      return guessedFolders

    } catch (error) {
      console.error("Error in getNewFolders:", error);
      return [this.settings.defaultDestinationPath];
    }
  }


}