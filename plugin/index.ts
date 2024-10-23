// import '../styles.css'; // Removed to prevent JS from injecting CSS

import {
  Plugin,
  Notice,
  TFolder,
  TFile,
  TAbstractFile,
  moment,
  normalizePath,
  loadPdfJs,
  requestUrl,
} from "obsidian";
import { logMessage, formatToSafeName, sanitizeTag } from "../utils";
import { FileOrganizerSettingTab } from "./views/settings/view";
import { ORGANIZER_VIEW_TYPE } from "./views/organizer";
import { CHAT_VIEW_TYPE } from "./views/ai-chat/view";
import Jimp from "jimp/es/index";

import { FileOrganizerSettings, DEFAULT_SETTINGS } from "./settings";

import { registerEventHandlers } from "./handlers/eventHandlers";
import {
  initializeChat,
  initializeOrganizer,
  initializeFileOrganizationCommands,
} from "./handlers/commandHandlers";
import {
  ensureFolderExists,
  checkAndCreateFolders,
  checkAndCreateTemplates,
  moveFile,
  getAllFolders,
} from "./fileUtils";
import { checkLicenseKey } from "./apiUtils";
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
    serverUrl = serverUrl.replace(/\/$/, "");
    logMessage(`Using server URL: ${serverUrl}`);

    return serverUrl;
  }

  /**
   * Processes a file by organizing it and logging the actions.
   * @param originalFile - The file to process.
   * @param oldPath - The previous path of the file, if any.
   */
  async processFileV2(originalFile: TFile, oldPath?: string): Promise<void> {
    const formattedDate = moment().format("YYYY-MM-DD");
    const processedFileName = originalFile.basename;
    const logFilePath = `${this.settings.logFolderPath}/${formattedDate}-fo2k.md`;

    try {
      // Initialize log file
      await this.ensureLogFileExists(logFilePath);
      await this.log(
        logFilePath,
        `\n\n## Processing Start: ${processedFileName}\n`
      );

      new Notice(`Processing ${processedFileName}`, 3000);
      await this.log(logFilePath, `Started processing ${processedFileName}`);

      // Validate file extension
      if (
        !originalFile.extension ||
        !isValidExtension(originalFile.extension)
      ) {
        await this.log(
          logFilePath,
          `2. Unsupported file type. Skipping ${processedFileName}`
        );
        new Notice("Unsupported file type. Skipping.", 3000);
        return;
      }

      // Ensure necessary folders exist
      await this.checkAndCreateFolders();

      // Step 1: Read file content
      let text: string;
      try {
        text = await this.getTextFromFile(originalFile);
        await this.log(
          logFilePath,
          `1. Read content from ${processedFileName}`
        );
      } catch (error) {
        await this.log(
          logFilePath,
          `2. Error reading file ${processedFileName}: ${error.message}`
        );
        new Notice(`Error reading file ${processedFileName}`, 3000);
        console.error(`Error in getTextFromFile:`, error);
        return;
      }

      // Step 2: Classify and format content
      let formattedText = text;
      if (this.settings.enableDocumentClassification) {
        const { classification, formattedText: newFormattedText } =
          await this.classifyAndFormatContent(originalFile, text);
        formattedText = newFormattedText;
        await this.log(
          logFilePath,
          `3. Classified as ${classification || "unclassified"}`
        );
      }

      // Step 3: Determine new folder
      const newPath = await this.getAIClassifiedFolder(
        formattedText,
        originalFile.path
      );
      await this.log(logFilePath, `4. Determined new folder: ${newPath}`);

      // Step 4: Generate new file name
      const newName = await this.generateNameFromContent(
        text,
        originalFile.basename
      );
      await this.log(logFilePath, `5. Generated new name: ${newName}`);

      // Step 5: Handle media files
      if (this.shouldCreateMarkdownContainer(originalFile)) {
        // Create markdown container
        const containerFile = await this.app.vault.create(
          `${this.settings.defaultDestinationPath}/${Date.now()}.md`,
          `${text}\n\n---\n![[${originalFile.name}]]`
        );
        await this.log(
          logFilePath,
          `6. Created markdown container: [[${containerFile.path}]]`
        );

        // Move original file to new location
        await this.moveFile(originalFile, originalFile.basename, newPath);
        await this.log(
          logFilePath,
          `7. Moved original to: ${newPath}/${originalFile.basename}`
        );

        // Move original file to attachments folder
        await this.moveToAttachmentFolder(originalFile, newName);
        await this.log(logFilePath, `8. Moved to attachments: ${newName}`);

        // Process the markdown container file
        if (this.settings.useSimilarTags) {
          await this.generateAndAppendSimilarTags(containerFile, text, newName);
          await this.log(logFilePath, `9. Added similar tags.`);
        }

        if (this.settings.enableAliasGeneration) {
          await this.generateAndAppendAliases(containerFile, newName, text);
          await this.log(logFilePath, `10. Added aliases.`);
        }
      } else {
        // For non-media files, process the original file
        if (this.settings.useSimilarTags) {
          await this.generateAndAppendSimilarTags(originalFile, text, newName);
          await this.log(logFilePath, `6. Added similar tags.`);
        }

        if (this.settings.enableAliasGeneration) {
          await this.generateAndAppendAliases(originalFile, newName, text);
          await this.log(logFilePath, `7. Added aliases.`);
        }

        // Move the file to the new folder
        await this.moveFile(originalFile, newName, newPath);
        await this.log(logFilePath, `8. Renamed and moved to: [[${newName}]]`);
      }

      await this.log(logFilePath, `10. Completed processing.`);
      new Notice(`Processed ${processedFileName}`, 3000);
    } catch (error) {
      await this.log(
        logFilePath,
        `Error processing ${processedFileName}: ${error.message}`
      );
      new Notice(`Unexpected error processing ${processedFileName}`, 3000);
      console.error(`Error in processFileV2:`, error);
    }
  }

  /**
   * Ensures that the log file exists. If not, creates it.
   * @param logFilePath - The path to the log file.
   */
  async ensureLogFileExists(logFilePath: string): Promise<void> {
    if (!(await this.app.vault.adapter.exists(normalizePath(logFilePath)))) {
      await this.app.vault.create(logFilePath, "");
    }
  }

  /**
   * Appends a single log entry to the specified log file.
   * @param logFilePath - The path to the log file.
   * @param message - The log message to append.
   */
  async log(logFilePath: string, message: string): Promise<void> {
    const logFile = this.app.vault.getAbstractFileByPath(logFilePath);
    if (!(logFile instanceof TFile)) {
      throw new Error(`Log file at path "${logFilePath}" is not a valid file.`);
    }

    const timestamp = moment().format("HH:mm:ss");
    const formattedMessage = `[${timestamp}] ${message}\n`;
    await this.app.vault.append(logFile, formattedMessage);
  }

  // Helper methods

  async generateAndApplyNewName(file: TFile, content: string): Promise<string> {
    const newName = await this.generateNameFromContent(content, file.basename);
    await this.app.fileManager.renameFile(
      file,
      `${file.parent?.path}/${newName}.${file.extension}`
    );
    return newName;
  }

  async classifyAndFormatContent(
    file: TFile,
    content: string
  ): Promise<{ classification?: string; formattedText: string }> {
    const result = await this.classifyAndFormat(file, content);
    if (result) {
      await this.app.vault.modify(file, result.formattedText);
      return {
        classification: result.type,
        formattedText: result.formattedText,
      };
    }
    return { formattedText: content };
  }

  async determineAndMoveToNewFolder(
    file: TFile,
    content: string
  ): Promise<string> {
    const newPath = await this.getAIClassifiedFolder(content, file.path);
    await this.moveFile(file, file.basename, newPath);
    return newPath;
  }

  async generateAndAppendAliases(
    file: TFile,
    newName: string,
    content: string
  ): Promise<void> {
    const aliases = await this.generateAliasses(newName, content);
    for (const alias of aliases) {
      await this.appendAlias(file, alias);
    }
  }

  async generateAndAppendSimilarTags(
    file: TFile,
    content: string,
    newName: string
  ): Promise<void> {
    const similarTags = await this.getSimilarTags(content, newName);
    for (const tag of similarTags) {
      await this.appendTag(file, tag);
    }
  }

  shouldCreateMarkdownContainer(file: TFile): boolean {
    return (
      validMediaExtensions.includes(file.extension) || file.extension === "pdf"
    );
  }

  async createMarkdownContainerForMedia(
    originalFile: TFile,
    newPath: string
  ): Promise<void> {
    const containerFile = await this.app.vault.create(
      `${newPath}/${originalFile.basename}.md`,
      `![[${originalFile.name}]]`
    );
    await this.moveToAttachmentFolder(originalFile, originalFile.basename);
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
      ? await this.classifyAndFormat(file, textToFeedAi)
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
      ? await this.getSimilarTags(textToFeedAi, documentName)
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
      const response = await makeApiRequest(() =>
        requestUrl({
          url: `${this.getServerUrl()}/api/concepts-and-chunks`,
          method: "POST",
          contentType: "application/json",
          body: JSON.stringify({ content }),
          throw: false,
          headers: {
            Authorization: `Bearer ${this.settings.API_KEY}`,
          },
        })
      );
      const { concepts } = await response.json;
      return concepts;
    } catch (error) {
      console.error("Error in identifyConceptsAndFetchChunks:", error);
      new Notice("An error occurred while processing the document.", 6000);
      throw error;
    }
  }

  async generateAliasses(name: string, content: string): Promise<string[]> {
    const response = await makeApiRequest(() =>
      requestUrl({
        url: `${this.getServerUrl()}/api/aliases`,
        method: "POST",
        contentType: "application/json",
        body: JSON.stringify({
          fileName: name,
          content,
        }),
        throw: false,
        headers: {
          Authorization: `Bearer ${this.settings.API_KEY}`,
        },
      })
    );
    const { aliases } = await response.json;
    return aliases;
  }

  async getSimilarTags(content: string, fileName: string): Promise<string[]> {
    const tags: string[] = await this.getAllVaultTags();

    if (tags.length === 0) {
      console.info("No tags found");
      return [];
    }

    const response = await makeApiRequest(() =>
      requestUrl({
        url: `${this.getServerUrl()}/api/tags`,
        method: "POST",
        contentType: "application/json",
        body: JSON.stringify({
          content,
          fileName,
          tags,
        }),
        throw: false,
        headers: {
          Authorization: `Bearer ${this.settings.API_KEY}`,
        },
      })
    );
    const { generatedTags } = await response.json;
    return generatedTags;
  }

  async formatContentV2(
    content: string,
    formattingInstruction: string
  ): Promise<string> {
    try {
      const response = await makeApiRequest(() =>
        requestUrl({
          url: `${this.getServerUrl()}/api/format`,
          method: "POST",
          contentType: "application/json",
          body: JSON.stringify({
            content,
            formattingInstruction,
          }),
          throw: false,
          headers: {
            Authorization: `Bearer ${this.settings.API_KEY}`,
          },
        })
      );

      const { content: formattedContent } = await response.json;
      return formattedContent;
    } catch (error) {
      console.error("Error formatting content:", error);
      new Notice("An error occurred while formatting the content.", 6000);
      return "";
    }
  }

  async classifyAndFormat(file: TFile, content: string) {
    try {
      const templateNames = await this.getTemplateNames();

      const classifiedType = await this.classifyContentV2(
        content,
        templateNames
      );

      if (classifiedType) {
        const formattingInstruction = await this.getTemplateInstructions(
          classifiedType
        );

        if (formattingInstruction) {
          const formattedText = await this.formatContentV2(
            content,
            formattingInstruction
          );

          console.log("formattedText", formattedText);
          return {
            type: classifiedType,
            formattingInstruction,
            formattedText,
          };
        }
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

  async formatContent({
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
    try {
      const response = await makeApiRequest(() =>
        requestUrl({
          url: `${this.getServerUrl()}/api/concepts`,
          method: "POST",
          contentType: "application/json",
          body: JSON.stringify({
            content,
          }),
          throw: false,
          headers: {
            Authorization: `Bearer ${this.settings.API_KEY}`,
          },
        })
      );

      const { concepts } = await response.json;
      return concepts;
    } catch (error) {
      console.error("Error identifying concepts:", error);
      new Notice("An error occurred while identifying concepts.", 6000);
      return [];
    }
  }

  async fetchChunkForConcept(
    content: string,
    concept: string
  ): Promise<{ content: string }> {
    try {
      const response = await makeApiRequest(() =>
        requestUrl({
          url: `${this.getServerUrl()}/api/chunks`,
          method: "POST",
          contentType: "application/json",
          body: JSON.stringify({
            content,
            concept,
          }),
          throw: false,
          headers: {
            Authorization: `Bearer ${this.settings.API_KEY}`,
          },
        })
      );

      const { chunk } = await response.json;
      return { content: chunk };
    } catch (error) {
      console.error("Error fetching chunk for concept:", error);
      new Notice("An error occurred while fetching chunk for concept.", 6000);
      return { content: "" };
    }
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

  async readPatternFiles(
    patternName: string
  ): Promise<{ systemContent: string; userContent: string }> {
    const patternDir = this.app.vault.getAbstractFileByPath(
      `_FileOrganizer2000/patterns/${patternName}`
    );
    if (!(patternDir instanceof TFolder)) {
      throw new Error(`Pattern directory not found: ${patternName}`);
    }

    const systemFile = patternDir.children.find(
      file => file.name === "system.md"
    );
    const userFile = patternDir.children.find(file => file.name === "user.md");

    if (!(systemFile instanceof TFile) || !(userFile instanceof TFile)) {
      throw new Error(
        `Missing system.md or user.md in pattern: ${patternName}`
      );
    }

    const systemContent = await this.app.vault.read(systemFile);
    const userContent = await this.app.vault.read(userFile);

    return { systemContent, userContent };
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
      "https://file-organizer-2000-x.onrender.com/transcribe";
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
    new Notice(
      `Generating transcription for ${file.basename}. This may take a few minutes.`,
      8000
    );
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
      "_FileOrganizer2000/patterns"
    );
    if (!patternFolder || !(patternFolder instanceof TFolder)) {
      console.error("Pattern folder not found or is not a valid folder.");
      return [];
    }
    const patternFolders = patternFolder.children
      .filter(file => file instanceof TFolder)
      .map(folder => folder.name);
    return patternFolders;
  }

  async classifyContentV2(
    content: string,
    classifications: string[]
  ): Promise<string> {
    const serverUrl = this.getServerUrl();
    try {
      const response = await fetch(`${serverUrl}/api/classify1`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.settings.API_KEY}`,
        },
        body: JSON.stringify({
          content,
          templateNames: classifications,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const { documentType } = await response.json;
      return documentType;
    } catch (error) {
      console.error("Error in classifyContentV2:", error);
      throw error;
    }
  }

  async organizeFile(file: TFile, content: string) {
    const destinationFolder = await this.getAIClassifiedFolder(
      content,
      file.path
    );
    new Notice(`Most similar folder: ${destinationFolder}`, 3000);
    await this.moveFile(file, file.basename, destinationFolder);
  }

  async showAssistantSidebar() {
    this.app.workspace.detachLeavesOfType(ORGANIZER_VIEW_TYPE);

    await this.app.workspace.getRightLeaf(false)?.setViewState({
      type: ORGANIZER_VIEW_TYPE,
      active: true,
    });

    this.app.workspace.revealLeaf(
      this.app.workspace.getLeavesOfType(ORGANIZER_VIEW_TYPE)[0]
    );
  }
  async showAIChatView() {
    // Detach any existing leaves of the AI Chat View type to ensure a fresh instance
    this.app.workspace.detachLeavesOfType(CHAT_VIEW_TYPE);

    // Create or get a new leaf on the right sidebar
    const leaf = this.app.workspace.getRightLeaf(false);
    if (!leaf) {
      console.error("Failed to obtain a workspace leaf for AI Chat View.");
      new Notice("Unable to open AI Chat View.", 3000);
      return;
    }

    // Set the view state to the AI Chat View
    await leaf.setViewState({
      type: CHAT_VIEW_TYPE,
      active: true,
    });

    // Reveal the leaf to focus it
    this.app.workspace.revealLeaf(leaf);
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
      case validAudioExtensions.includes(file.extension): {
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

  getAllNonFo2kFolders(): string[] {
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
      .filter(folder => folder !== this.settings.templatePaths)
      .filter(folder => folder !== this.settings.fabricPatternPath);
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

    const similarFiles = await this.generateRelationships(
      activeFileContent,
      fileContents
    );

    return similarFiles.filter(
      (file: string) =>
        !settingsPaths.some(path => file.includes(path)) &&
        !this.settings.ignoreFolders.includes(file)
    );
  }

  async generateRelationships(
    activeFileContent: string,
    files: { name: string }[]
  ): Promise<string[]> {
    const response = await makeApiRequest(() =>
      requestUrl({
        url: `${this.getServerUrl()}/api/relationships`,
        method: "POST",
        contentType: "application/json",
        body: JSON.stringify({
          activeFileContent,
          files,
        }),
        headers: {
          Authorization: `Bearer ${this.settings.API_KEY}`,
        },
      })
    );
    const { similarFiles } = await response.json;
    return similarFiles;
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
    const name = await this.generateDocumentTitle(
      content,
      currentName,
      renameInstructions
    );
    return formatToSafeName(name);
  }

  async generateDocumentTitle(
    content: string,
    currentName: string,
    renameInstructions: string
  ): Promise<string> {
    const response = await makeApiRequest(() =>
      requestUrl({
        url: `${this.getServerUrl()}/api/title`,
        method: "POST",
        contentType: "application/json",
        body: JSON.stringify({
          document: content,
          instructions: renameInstructions,
          currentName,
        }),
        throw: false,
        headers: {
          Authorization: `Bearer ${this.settings.API_KEY}`,
        },
      })
    );
    const { title } = await response.json;
    return title;
  }

  // get random titles from the users vault to get better titles suggestions
  getRandomVaultTitles(count: number): string[] {
    const allFiles = this.app.vault.getFiles();
    const filteredFiles = allFiles.filter(
      file =>
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

  async generateImageAnnotation(file: TFile) {
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

    const processedContent = await this.extractTextFromImage(
      processedArrayBuffer
    );

    return processedContent;
  }

  async extractTextFromImage(image: ArrayBuffer): Promise<string> {
    const base64Image = this.arrayBufferToBase64(image);

    const response = await makeApiRequest(() =>
      requestUrl({
        url: `${this.getServerUrl()}/api/vision`,
        method: "POST",
        contentType: "application/json",
        body: JSON.stringify({ image: base64Image }),
        throw: false,
        headers: {
          Authorization: `Bearer ${this.settings.API_KEY}`,
        },
      })
    );
    const { text } = await response.json;
    return text;
  }

  arrayBufferToBase64(buffer: ArrayBuffer): string {
    let binary = "";
    const bytes = new Uint8Array(buffer);
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
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

    const uniqueFolders = await this.getAllNonFo2kFolders();
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

    const customInstructions = this.settings.enableCustomFolderInstructions
      ? this.settings.customFolderInstructions
      : undefined;

    const guessedFolder = await this.guessRelevantFolder(
      content,
      filePath,
      filteredFolders,
      customInstructions
    );

    if (guessedFolder === null || guessedFolder === "null") {
      logMessage("no good folder, creating a new one instead");
      const newFolderName = await this.createNewFolder(
        content,
        filePath,
        filteredFolders
      );
      destinationFolder = newFolderName;
    } else {
      destinationFolder = guessedFolder;
    }
    return destinationFolder;
  }

  async guessRelevantFolder(
    content: string,
    filePath: string,
    folders: string[],
    customInstructions?: string
  ): Promise<string | null> {
    const response = await makeApiRequest(() =>
      requestUrl({
        url: `${this.getServerUrl()}/api/folders`,
        method: "POST",
        contentType: "application/json",
        body: JSON.stringify({
          content,
          fileName: filePath,
          folders,
          customInstructions,
        }),
        throw: false,
        headers: {
          Authorization: `Bearer ${this.settings.API_KEY}`,
        },
      })
    );
    const { folder: guessedFolder } = await response.json;
    return guessedFolder;
  }

  async createNewFolder(
    content: string,
    fileName: string,
    existingFolders: string[]
  ): Promise<string> {
    const response = await makeApiRequest(() =>
      requestUrl({
        url: `${this.getServerUrl()}/api/create-folder`,
        method: "POST",
        contentType: "application/json",
        body: JSON.stringify({
          content,
          fileName,
          existingFolders,
        }),
        throw: false,
        headers: {
          Authorization: `Bearer ${this.settings.API_KEY}`,
        },
      })
    );
    const { folderName } = await response.json;
    return folderName;
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

    new Notice(`Added similar tags to ${file.basename}`, 3000);
    return;
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

    this.settings.fabricPatternPath = "_FileOrganizer2000/Fabric";
    await this.saveSettings();

    // Initialize different features
    initializeChat(this);
    initializeOrganizer(this);
    initializeFileOrganizationCommands(this);

    this.app.workspace.onLayoutReady(() => registerEventHandlers(this));
    this.processBacklog();
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
      console.error("Template folder not found or is not a valid folder.");
      return "";
    }
    // only look at files first
    const templateFile = templateFolder.children.find(
      file => file instanceof TFile && file.basename === templateName
    );
    if (!templateFile || !(templateFile instanceof TFile)) {
      console.error("Template file not found or is not a valid file.");
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
      console.error("Template folder not found or is not a valid folder.");
      return [];
    }
    const templateFiles = templateFolder.children.filter(
      file => file instanceof TFile
    ) as TFile[];
    return templateFiles.map(file => file.basename);
  }

  async getExistingFolders(
    content: string,
    filePath: string
  ): Promise<string[]> {
    if (this.settings.ignoreFolders.includes("*")) {
      return [this.settings.defaultDestinationPath];
    }
    const currentFolder =
      this.app.vault.getAbstractFileByPath(filePath)?.parent?.path || "";
    const filteredFolders = this.getAllNonFo2kFolders()
      .filter(folder => folder !== currentFolder)

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
        ? "/api/folders/embeddings"
        : "/api/folders/existing";

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
            Authorization: `Bearer ${this.settings.API_KEY}`,
          },
        })
      );
      const { folders: guessedFolders } = await response.json;
      return guessedFolders;
    } catch (error) {
      console.error("Error in getExistingFolders:", error);
      return [this.settings.defaultDestinationPath];
    }
  }
  async getNewFolders(content: string, filePath: string): Promise<string[]> {
    const uniqueFolders = await this.getAllNonFo2kFolders();
    if (this.settings.ignoreFolders.includes("*")) {
      return [this.settings.defaultDestinationPath];
    }
    const currentFolder =
      this.app.vault.getAbstractFileByPath(filePath)?.parent?.path || "";
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
            Authorization: `Bearer ${this.settings.API_KEY}`,
          },
        })
      );
      const { folders: guessedFolders } = await response.json;
      return guessedFolders;
    } catch (error) {
      console.error("Error in getNewFolders:", error);
      return [this.settings.defaultDestinationPath];
    }
  }
}
