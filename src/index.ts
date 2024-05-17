import {
  Plugin,
  Notice,
  TFolder,
  TFile,
  TAbstractFile,
  moment,
  WorkspaceLeaf,
  requestUrl,
  normalizePath,
} from "obsidian";
import useVision from "./modules/vision";
import { logMessage, formatToSafeName } from "../utils";
import { FileOrganizerSettingTab } from "./FileOrganizerSettingTab";
import { ASSISTANT_VIEW_TYPE, AssistantViewWrapper } from "./AssistantView";
import Jimp from "jimp";
type TagCounts = {
  [key: string]: number;
};

class FileOrganizerSettings {
  API_KEY = "";
  useLogs = true;
  defaultDestinationPath = "_FileOrganizer2000/Processed";
  attachmentsPath = "_FileOrganizer2000/Processed/Attachments";
  pathToWatch = "_FileOrganizer2000/Inbox";
  logFolderPath = "_FileOrganizer2000/Logs";
  useSimilarTags = true; // default value is true
  renameDocumentTitle = false; // default value is true
  useAliases = false; // default value is false
  useAutoAppend = false;
  defaultServerUrl = "https://app.fileorganizer2000.com";
  customServerUrl = "https://file-organizer-2000.vercel.app/";
  useCustomServer = false;
  useSimilarTagsInFrontmatter = false;
  enableEarlyAccess = false;
  earlyAccessCode = "";
  processedTag = false;
  // new formatting
  templatePaths = "_FileOrganizer2000/Templates";
  transcribeEmbeddedAudio = false;
  enableDocumentClassification = false;
  renameUntitledOnly = true;

  ignoreFolders = ["_FileOrganizer2000"];
  stagingFolder = ".fileorganizer2000/staging";
  disableImageAnnotation = false;
}

const validAudioExtensions = ["mp3", "wav", "webm", "m4a"];
const validImageExtensions = ["png", "jpg", "jpeg", "gif", "svg", "webp"];
const validMediaExtensions = [...validAudioExtensions, ...validImageExtensions];
const validTextExtensions = ["md", "txt"];
const validExtensions = [...validMediaExtensions, ...validTextExtensions];

const isValidExtension = (extension: string) => {
  if (!validExtensions.includes(extension)) {
    new Notice("Sorry, FileOrganizer does not support this file type.");
    return false;
  }
  return true;
};

// move to utils later
// @ts-ignore
export async function makeApiRequest<T>(
  requestFn: () => Promise<T>
): Promise<T> {
  try {
    return await requestFn();
  } catch (error) {
    console.error("API request error:", error);
    if (error.status === 429) {
      new Notice(
        "You have run out of credits. Please upgrade your plan.",
        6000
      );
    } else {
      new Notice("An error occurred while processing the request.", 6000);
      console.error("API request error:", error);
    }
    throw error;
  }
}

export default class FileOrganizer extends Plugin {
  settings: FileOrganizerSettings;

  // all files in inbox will go through this function
  async processFileV2(originalFile: TFile, oldPath?: string) {
    try {
      new Notice(`Looking at ${originalFile.basename}`, 3000);
      this.validateAPIKey();

      if (
        !originalFile.extension ||
        !isValidExtension(originalFile.extension)
      ) {
        return;
      }
      

      await this.checkAndCreateFolders();

      const text = await this.getTextFromFile(originalFile);

      let documentName = originalFile.basename;

      if (this.shouldRename(originalFile)) {
        new Notice(`Generating name for ${text.substring(0, 20)}...`, 3000);
        documentName = await this.generateNameFromContent(text);
      }

      let processedFile = originalFile;

      if (validMediaExtensions.includes(originalFile.extension)) {
        const attachmentFile = originalFile;
        if (
          this.settings.disableImageAnnotation &&
          validImageExtensions.includes(originalFile.extension)
        ) {
          // If image annotation is disabled and the file is an image, move the image to the AI-classified folder
          const destinationFolder = await this.getAIClassifiedFolder(
            text,
            processedFile
          );
          new Notice(`Moving file to ${destinationFolder} folder`, 3000);
          await this.moveFile(attachmentFile, documentName, destinationFolder);
          await this.appendToCustomLogFile(
            `Moved [[${documentName}.${attachmentFile.extension}]] to ${destinationFolder}`
          );
          return;
        } else {
          // If image annotation is enabled or the file is an audio, proceed with the existing logic
          const annotatedMarkdownFile = await this.createMarkdownFileFromText(
            text
          );
          console.log("annotatedMarkdownFile", annotatedMarkdownFile);
          await this.moveToAttachmentFolder(attachmentFile, documentName);
          console.log("moved to attachment folder");
          await this.appendAttachment(annotatedMarkdownFile, originalFile);
          console.log("appended attachment");
          processedFile = annotatedMarkdownFile;
          this.appendToCustomLogFile(
            `Generated annotation for [[${annotatedMarkdownFile.basename}]]`
          );
        }
      }

      if (this.settings.enableDocumentClassification) {
        const classification = await this.classifyAndFormatDocument(
          processedFile,
          text
        );
        classification &&
          this.appendToCustomLogFile(
            `Classified [[${processedFile.basename}]] as ${classification.type}`
          );
      }

      const destinationFolder = await this.getAIClassifiedFolder(
        text,
        processedFile
      );
      new Notice(`Most similar folder: ${destinationFolder}`, 3000);
      await this.appendAlias(processedFile, processedFile.basename);
      const movedFile = await this.moveFile(
        processedFile,
        documentName,
        destinationFolder
      );
      await this.appendToCustomLogFile(
        `Organized [[${movedFile.basename}]] into ${destinationFolder}`
      );

      await this.appendSimilarTags(text, movedFile);

      await this.tagAsProcessed(movedFile);

      // Create a metadata file to store processing information
      // await this.createMetadataFile(movedFile, { originalPath: oldPath });
    } catch (error) {
      new Notice(`Error processing ${originalFile.basename}`, 3000);
      new Notice(error.message, 6000);
      console.error(error);
    }
  }

  async createMetadataFile(file: TFile, metadata: Record<string, any>) {
    const metadataFolderPath = "_FileOrganizer2000/.metadata";
    await this.ensureFolderExists(metadataFolderPath);

    const metadataFilePath = `${metadataFolderPath}/${file.basename}.json`;
    const metadataContent = JSON.stringify(metadata, null, 2);

    await this.app.vault.create(metadataFilePath, metadataContent);
  }
  shouldRename(file: TFile): boolean {
    const isRenameEnabled = this.settings.renameDocumentTitle;
    const isUntitledFile = /^untitled/i.test(file.basename);
    if (file.extension !== "md") {
      console.log("renaming non markdown file");
      return true;
    }

    if (!isRenameEnabled) {
      return false;
    }

    if (this.settings.renameUntitledOnly && !isUntitledFile) {
      return false;
    }

    return true;
  }

  async classifyAndFormatDocument(file: TFile, content: string) {
    const classification = await this.classifyContent(content, file.basename);

    if (classification) {
      await this.formatContent(file, content, classification);
      return classification;
    }
    return null;
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
      (file) => file instanceof TFile
    ) as TFile[];

    const classifications = await Promise.all(
      templateFiles.map(async (file) => ({
        type: file.basename,
        formattingInstruction: await this.app.vault.read(file),
      }))
    );

    return classifications;
  }

  async classifyContent(
    content: string,
    name: string
  ): Promise<{ type: string; formattingInstruction: string } | null> {
    const classifications = await this.getClassifications();
    const templateNames = classifications.map((c) => c.type);

    const response = await makeApiRequest(() =>
      requestUrl({
        url: `${
          this.settings.useCustomServer
            ? this.settings.customServerUrl
            : this.settings.defaultServerUrl
        }/api/classify`,
        method: "POST",
        body: JSON.stringify({
          content,
          fileName: name,
          templateNames,
        }),
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.settings.API_KEY}`,
        },
      })
    );
    const { documentType } = await response.json;

    const selectedClassification = classifications.find(
      (c) => c.type.toLowerCase() === documentType.toLowerCase()
    );

    return selectedClassification || null;
  }

  async formatContent(
    file: TFile,
    fileContent: string,
    selectedClassification: { type: string; formattingInstruction: string }
  ) {
    // send a message to /api/text
    // use requestUrl
    const response = await makeApiRequest(() =>
      requestUrl({
        url: `${
          this.settings.useCustomServer
            ? this.settings.customServerUrl
            : this.settings.defaultServerUrl
        }/api/text`,
        method: "POST",
        body: JSON.stringify({
          content: fileContent,
          formattingInstruction: selectedClassification.formattingInstruction,
        }),

        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.settings.API_KEY}`,
        },
      })
    );
    const { message } = await response.json;

    // delete file
    await this.app.vault.modify(file, message);
  }
  /* experimental above until further notice */

  async organizeFile(file: TFile, content: string) {
    const destinationFolder = await this.getAIClassifiedFolder(content, file);
    new Notice(`Most similar folder: ${destinationFolder}`, 3000);
    await this.moveFile(file, file.basename, destinationFolder);
  }

  // let's unpack this into processFileV2
  async renameTagAndOrganize(file: TFile, content: string, fileName: string) {
    const destinationFolder = await this.getAIClassifiedFolder(content, file);
    new Notice(`Most similar folder: ${destinationFolder}`, 3000);
    await this.appendAlias(file, file.basename);
    await this.moveFile(file, fileName, destinationFolder);
    await this.appendSimilarTags(content, file);
  }

  async createBackup(file: TFile) {
    const destinationFolder = this.settings.defaultDestinationPath;
    const destinationPath = `${destinationFolder}/${file.name}`;
    await this.app.vault.copy(file, destinationPath);
    this.appendToCustomLogFile(
      `Backed Up [[${file.name}]] to ${destinationPath}`
    );
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
    let content = "";
    if (file.extension === "md") {
      content = await this.app.vault.read(file);
    } else if (validImageExtensions.includes(file.extension)) {
      content = await this.generateImageAnnotation(file);
    } else if (validAudioExtensions.includes(file.extension)) {
      content = await this.generateTranscriptFromAudio(file);
    }
    return content;
  }

  // adds an attachment to a file using the ![[attachment]] syntax
  async appendAttachment(markdownFile: TFile, attachmentFile: TFile) {
    await this.app.vault.append(markdownFile, `![[${attachmentFile.name}]]`);
  }
  async appendToFrontMatter(file: TFile, key: string, value: string) {
    await this.app.fileManager.processFrontMatter(file, (frontmatter) => {
      if (!frontmatter.hasOwnProperty(key)) {
        frontmatter[key] = value;
        return;
      }
      if (!Array.isArray(frontmatter[key])) {
        frontmatter[key] = [frontmatter[key]];
      }
      frontmatter[key].push(value);
    });
  }

  async appendAlias(file: TFile, alias: string) {
    if (!this.settings.useAliases) {
      return;
    }
    this.appendToFrontMatter(file, "alias", alias);
  }

  // creates a .md file with a humean readable name guessed from the content
  async createMarkdownFileFromText(content: string) {
    const now = new Date();
    const formattedNow = now.toISOString().replace(/[-:.TZ]/g, "");
    let name = formattedNow;
    try {
      name = await this.generateNameFromContent(content);
    } catch (error) {
      console.error("Error processing file:", error.status);
      new Notice("Could not set a human readable name.");
    }
    const safeName = formatToSafeName(name);

    let outputFilePath = `/${this.settings.defaultDestinationPath}/${safeName}.md`;
    const existingFile = this.app.vault.getAbstractFileByPath(outputFilePath);

    if (existingFile) {
      const timestamp = Date.now();
      const timestampedFileName = `${safeName}_${timestamp}`;
      outputFilePath = `/${this.settings.defaultDestinationPath}/${timestampedFileName}.md`;
    }
    const file = await this.app.vault.create(outputFilePath, content);
    return file;
  }

  async moveFile(
    file: TFile,
    humanReadableFileName: string,
    destinationFolder = ""
  ) {
    let destinationPath = `${destinationFolder}/${humanReadableFileName}.${file.extension}`;
    if (await this.app.vault.adapter.exists(normalizePath(destinationPath))) {
      await this.appendToCustomLogFile(
        `File [[${humanReadableFileName}]] already exists. Renaming to [[${humanReadableFileName}]]`
      );
      const timestamp = Date.now();
      const timestampedFileName = `${humanReadableFileName}_${timestamp}`;
      destinationPath = `${destinationFolder}/${timestampedFileName}.${file.extension}`;
    }
    await this.ensureFolderExists(destinationFolder);
    await this.app.vault.rename(file, `${destinationPath}`);
    return file;
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
      (file) =>
        !settingsPaths.some((path) => file.path.includes(path)) &&
        file.path !== fileToCheck.path
    );

    const fileContents = await Promise.all(
      allFilesFiltered.map(async (file) => ({
        name: file.path,
        // skiping content for now
        // content: await this.app.vault.read(file),
      }))
    );

    const data = {
      activeFileContent,
      files: fileContents,
    };

    const response = await makeApiRequest(() =>
      requestUrl({
        url: `${
          this.settings.useCustomServer
            ? this.settings.customServerUrl
            : this.settings.defaultServerUrl
        }/api/relationships`,
        method: "POST",
        body: JSON.stringify(data),
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.settings.API_KEY}`,
        },
      })
    );

    const result = await response.json;
    const similarFiles = result.similarFiles
      .filter((file: string) => !file.includes(this.settings.pathToWatch))
      .filter(
        (file: string) => !file.includes(this.settings.defaultDestinationPath)
      )
      .filter((file: string) => !file.includes(this.settings.attachmentsPath))
      .filter((file: string) => !file.includes(this.settings.logFolderPath))
      .filter((file: string) => !file.includes(this.settings.templatePaths))
      .filter((file: string) => !this.settings.ignoreFolders.includes(file));

    return similarFiles;
  }

  async moveToAttachmentFolder(file: TFile, newFileName: string) {
    const destinationFolder = this.settings.attachmentsPath;
    await this.moveFile(file, newFileName, destinationFolder);
    await this.appendToCustomLogFile(
      `Moved [[${newFileName}.${file.extension}]] to attachments`
    );
  }

  async generateNameFromContent(content: string): Promise<string> {
    const response = await makeApiRequest(() =>
      requestUrl({
        url: `${
          this.settings.useCustomServer
            ? this.settings.customServerUrl
            : this.settings.defaultServerUrl
        }/api/name`,
        method: "POST",
        body: JSON.stringify({ document: content }),
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.settings.API_KEY}`,
        },
      })
    );

    const data = await response.json;
    const safeName = formatToSafeName(data.name);
    return safeName;
  }

  async generateTranscriptFromAudio(file: TFile) {
    new Notice(
      `Generating transcription for ${file.basename} this can take up to a minute`,
      8000
    );
    // @ts-ignore
    try {
      const arrayBuffer = await this.app.vault.readBinary(file);
      const fileContent = Buffer.from(arrayBuffer);
      const encodedAudio = fileContent.toString("base64");
      logMessage(`Encoded: ${encodedAudio.substring(0, 20)}...`);

      const endpoint = "api/audio";
      const url = `${
        this.settings.useCustomServer
          ? this.settings.customServerUrl
          : this.settings.defaultServerUrl
      }/${endpoint}`;
      const result = await makeApiRequest(() =>
        requestUrl({
          url: url,
          method: "POST",
          body: JSON.stringify({
            file: encodedAudio,
            extension: file.extension,
          }),
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${this.settings.API_KEY}`,
          },
        })
      );
      const data = await result.json;
      const postProcessedText = data.transcription;
      return postProcessedText;
    } catch (e) {
      console.error("Error generating transcript", e);
      new Notice("Error generating transcript", 3000);
      return "";
    }
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
  async generateImageAnnotation(file: TFile, customPrompt?: string) {
    new Notice(
      `Generating annotation for ${file.basename} this can take up to a minute`,
      8000
    );

    const arrayBuffer = await this.app.vault.readBinary(file);
    const fileContent = Buffer.from(arrayBuffer);
    const imageSize = fileContent.byteLength;
    const imageSizeInMB2 = imageSize / (1024 * 1024);
    logMessage(`Image size: ${imageSizeInMB2.toFixed(2)} MB`);

    let encodedImage: string;

    if (!this.isWebP(fileContent)) {
      // Compress the image if it's not a WebP
      const resizedImage = await this.compressImage(fileContent);
      encodedImage = resizedImage.toString("base64");
    } else {
      // If it's a WebP, encode the original file content directly
      encodedImage = fileContent.toString("base64");
    }

    const imageSizeInBytes = Buffer.byteLength(encodedImage, "base64");
    const imageSizeInMB = imageSizeInBytes / (1024 * 1024);
    logMessage(`Image size: ${imageSizeInMB.toFixed(2)} MB`);
    logMessage(`Encoded: ${encodedImage.substring(0, 20)}...`);

    const processedContent = await useVision(encodedImage, customPrompt, {
      baseUrl: this.settings.useCustomServer
        ? this.settings.customServerUrl
        : this.settings.defaultServerUrl,
      apiKey: this.settings.API_KEY,
    });

    return processedContent;
  }
  async ensureFolderExists(folderPath: string) {
    if (!(await this.app.vault.adapter.exists(folderPath))) {
      await this.app.vault.createFolder(folderPath);
    }
  }
  async checkAndCreateFolders() {
    this.ensureFolderExists(this.settings.pathToWatch);
    this.ensureFolderExists(this.settings.defaultDestinationPath);
    this.ensureFolderExists(this.settings.attachmentsPath);
    this.ensureFolderExists(this.settings.logFolderPath);
    this.ensureFolderExists(this.settings.templatePaths);
    // used to store info about changes
    this.ensureFolderExists(this.settings.stagingFolder);
  }

  async getBacklog() {
    const allFiles = this.app.vault.getFiles();
    const pendingFiles = allFiles.filter((file) =>
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
    // 1. Get all tags from the vault
    // @ts-ignore
    const tags: TagCounts[] = this.app.metadataCache.getTags();
    // if tags is = {} return
    if (Object.keys(tags).length === 0) {
      logMessage("No tags found");
      return [];
    }

    // sort tags from most to least common
    const sortedTags = Object.entries(tags).sort((a, b) => b[1] - a[1]);
    logMessage("Sorted tags", sortedTags);

    const data = {
      content,
      fileName,
      tags: sortedTags.map((tag) => tag[0]),
    };

    const response = await makeApiRequest(() =>
      requestUrl({
        url: `${
          this.settings.useCustomServer
            ? this.settings.customServerUrl
            : this.settings.defaultServerUrl
        }/api/tagging`,
        method: "POST",
        body: JSON.stringify(data),
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.settings.API_KEY}`,
        },
      })
    );

    const result = await response.json;
    return result.tags;
  }
  isTFolder(file: TAbstractFile): file is TFolder {
    return file instanceof TFolder;
  }

  getAllFolders(): string[] {
    const allFiles = this.app.vault.getAllLoadedFiles();
    const folderPaths = allFiles
      .filter((file) => this.isTFolder(file))
      .map((folder) => folder.path);

    const uniqueFolders = [...new Set(folderPaths)];
    // logMessage("uniqueFolders", uniqueFolders);
    return uniqueFolders;
  }

  async getAIClassifiedFolder(content: string, file: TFile): Promise<string> {
    // Initialize destination folder as "None"
    let destinationFolder = "None";

    // Get all folders
    const uniqueFolders = this.getAllFolders()
      // remove current file path
      .filter((folder) => folder !== file.parent?.path)
      // remove default destination path
      .filter((folder) => folder !== this.settings.defaultDestinationPath)
      .filter((folder) => folder !== this.settings.attachmentsPath)
      .filter((folder) => folder !== this.settings.logFolderPath)
      .filter((folder) => folder !== this.settings.pathToWatch)
      .filter((folder) => folder !== this.settings.templatePaths)
      // remove default folders
      .filter((folder) => !this.settings.ignoreFolders.includes(folder))
      // filter /
      .filter((folder) => folder !== "/");

    const data = {
      content,
      fileName: file.basename,
      folders: uniqueFolders,
    };

    const response = await makeApiRequest(() =>
      requestUrl({
        url: `${
          this.settings.useCustomServer
            ? this.settings.customServerUrl
            : this.settings.defaultServerUrl
        }/api/folders`,
        method: "POST",
        body: JSON.stringify(data),
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.settings.API_KEY}`,
        },
      })
    );
    logMessage("response", response.json);

    const result = await response.json;

    if (result.folder === "None") {
      destinationFolder = this.settings.defaultDestinationPath;
    } else {
      destinationFolder = result.folder;
    }

    return destinationFolder;
  }

  async appendTag(file: TFile, tag: string) {
    // Append similar tags
    if (this.settings.useSimilarTagsInFrontmatter) {
      await this.appendToFrontMatter(file, "tags", tag);
      return;
    }
    await this.app.vault.append(file, `\n${tag}`);
  }

  async appendSimilarTags(content: string, file: TFile) {
    if (!this.settings.useSimilarTags) {
      return;
    }
    // Get similar tags
    const similarTags = await this.getSimilarTags(content, file.basename);

    if (similarTags.length === 0) {
      new Notice(`No similar tags found`, 3000);
      return;
    }
    similarTags.forEach(async (tag) => {
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
    const logFilePath = `${this.settings.logFolderPath}/${formattedDate}.md`;
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
    if (this.settings.useCustomServer) {
      // atm we assume no api auth for self hosted
      return true;
    }

    if (!this.settings.API_KEY) {
      throw new Error(
        "Please enter your API Key in the settings of the FileOrganizer plugin."
      );
    }
  }

  // native

  async onload() {
    await this.initializePlugin();
    this.addRibbonIcon("sparkle", "Fo2k Assistant View", () => {
      this.showAssistantSidebar();
    });

    // on layout ready register event handlers
    this.addCommand({
      id: "append-existing-tags",
      name: "Append existing tags",
      callback: async () => {
        const activeFile = this.app.workspace.getActiveFile();
        if (activeFile) {
          const fileContent = await this.getTextFromFile(activeFile);
          await this.appendSimilarTags(fileContent, activeFile);
        }
      },
    });

    this.addCommand({
      id: "show-assistant",
      name: "Show Assistant",
      callback: async () => {
        await this.showAssistantSidebar();
      },
    });

    this.addCommand({
      id: "add-to-inbox",
      name: "Put in inbox",
      callback: async () => {
        const activeFile = this.app.workspace.getActiveFile();
        if (activeFile) {
          await this.processFileV2(activeFile);
        }
      },
    });

    this.addCommand({
      id: "organize-text-file",
      name: "Organize text file",
      callback: async () => {
        const activeFile = this.app.workspace.getActiveFile();
        if (activeFile) {
          const fileContent = await this.getTextFromFile(activeFile);
          await this.organizeFile(activeFile, fileContent);
        }
      },
    });

    this.app.workspace.onLayoutReady(this.registerEventHandlers.bind(this));
    this.processBacklog();
  }
  async loadSettings() {
    this.settings = Object.assign(
      {},
      new FileOrganizerSettings(),
      await this.loadData()
    );
  }
  async saveSettings() {
    await this.saveData(this.settings);
  }

  async initializePlugin() {
    await this.loadSettings();
    await this.checkAndCreateFolders();
    this.addSettingTab(new FileOrganizerSettingTab(this.app, this));
    this.registerView(
      ASSISTANT_VIEW_TYPE,
      (leaf: WorkspaceLeaf) => new AssistantViewWrapper(leaf, this)
    );
  }

  async checkForEarlyAccess() {
    try {
      const response = await makeApiRequest(() =>
        requestUrl({
          url: `${
            this.settings.useCustomServer
              ? this.settings.customServerUrl
              : this.settings.defaultServerUrl
          }/api/early-access`,
          method: "POST",
          body: JSON.stringify({ code: this.settings.earlyAccessCode }),
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${this.settings.API_KEY}`,
          },
        })
      );

      const result = await response.json;
      return result.isCustomer;
    } catch (e) {
      new Notice("Error checking for early access", 3000);
      console.error("Error checking for early access", e);
      return false;
    }
  }
  async processEmbeddedAudioFile(audioFile: TFile, parentFile: TFile) {
    try {
      const transcript = await this.generateTranscriptFromAudio(audioFile);
      await this.appendTranscriptToActiveFile(
        parentFile,
        audioFile.basename,
        transcript
      );
      new Notice(
        `Generated transcript for ${audioFile.basename} and appended to ${parentFile.basename}`,
        3000
      );
    } catch (error) {
      console.error(
        `Error processing embedded audio file ${audioFile.basename}:`,
        error
      );
      new Notice(
        `Error processing embedded audio file ${audioFile.basename}`,
        3000
      );
    }
  }
  async appendTranscriptToActiveFile(
    parentFile: TFile,
    audioFileName: string,
    transcript: string
  ) {
    const transcriptBlock = `\n\n## Transcript for ${audioFileName}\n\n${transcript}`;
    await this.app.vault.append(parentFile, transcriptBlock);
  }

  registerEventHandlers() {
    // audio append events
    this.registerEvent(
      this.app.vault.on("create", async (file) => {
        if (!this.settings.transcribeEmbeddedAudio) return;
        const activeFile = this.app.workspace.getActiveFile();
        if (
          activeFile &&
          file instanceof TFile &&
          validAudioExtensions.includes(file.extension)
        ) {
          await this.processEmbeddedAudioFile(file, activeFile);
        }
      })
    );

    // inbox events
    this.registerEvent(
      this.app.vault.on("create", (file) => {
        if (!file.path.includes(this.settings.pathToWatch)) return;
        if (file instanceof TFile) {
          this.processFileV2(file);
        }
      })
    );
    this.registerEvent(
      this.app.vault.on("rename", (file, oldPath) => {
        if (!file.path.includes(this.settings.pathToWatch)) return;
        if (file instanceof TFile) {
          this.processFileV2(file, oldPath);
        }
      })
    );
  }
}
