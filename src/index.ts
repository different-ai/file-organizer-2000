import {
  Plugin,
  Notice,
  TFolder,
  TFile,
  TAbstractFile,
  moment,
  WorkspaceLeaf,
  getLinkpath,
  requestUrl,
} from "obsidian";
import useName from "./modules/name";
import useVision from "./modules/vision";
import useAudio from "./modules/audio";
import useText from "./modules/text";
import { logMessage, formatToSafeName } from "../utils";
import { FileOrganizerSettingTab } from "./FileOrganizerSettingTab";
import { ASSISTANT_VIEW_TYPE, AssistantView } from "./AssistantView";
class FileOrganizerSettings {
  API_KEY = "";
  useLogs = true;
  defaultDestinationPath = "_FileOrganizer2000/Processed";
  attachmentsPath = "_FileOrganizer2000/Processed/Attachments";
  pathToWatch = "_FileOrganizer2000/Inbox";
  logFolderPath = "_FileOrganizer2000/Logs";
  useSimilarTags = true; // default value is true
  renameDocumentTitle = true; // default value is true
  useAliases = false; // default value is false
  customVisionPrompt = ""; // default value is an empty string
  useAutoAppend = false;
  defaultServerUrl = "https://app.fileorganizer2000.com";
  customServerUrl = "https://file-organizer-2000.vercel.app/";
  useCustomServer = false;
  useSimilarTagsInFrontmatter = false;
  enableEarlyAccess = false;
  earlyAccessCode = "";
  processedTag = false;
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

export default class FileOrganizer extends Plugin {
  settings: FileOrganizerSettings;

  // all files in inbox will go through this function
  async processFileV2(originalFile: TFile) {
    try {
      new Notice(`Looking at ${originalFile.basename}`, 3000);
      this.validateAPIKey();
      if (!originalFile.extension || !isValidExtension(originalFile.extension))
        return;

      await this.checkAndCreateFolders();
      const text = await this.getTextFromFile(originalFile); // Correctly obtaining text from the file

      const isRenameEnabled = this.settings.renameDocumentTitle;
      if (isRenameEnabled) {
        new Notice(`Generating name for ${text.substring(0, 20)}...`, 3000);
      }
      // Use 'text' instead of 'content' which was incorrectly referenced
      const humanReadableFileName = isRenameEnabled
        ? await this.generateNameFromContent(text) // Corrected to use 'text'
        : originalFile.basename;
      if (isRenameEnabled) {
        new Notice(`Generated name: ${humanReadableFileName}`, 3000);
      }
      if (validMediaExtensions.includes(originalFile.extension)) {
        // Media file handling logic
        const annotatedFile = await this.createFileFromContent(text);
        this.appendToCustomLogFile(
          `Generated annotation for [[${annotatedFile.basename}]]`
        );
        await this.moveToDefaultAttachmentFolder(
          originalFile,
          humanReadableFileName
        );
        await this.appendAttachment(annotatedFile, originalFile);
        await this.renameTagAndOrganize(
          annotatedFile,
          text,
          humanReadableFileName
        );
        await this.tagAsProcessed(annotatedFile);
      } else {
        // Non-media file handling logic
        await this.renameTagAndOrganize(
          originalFile,
          text,
          humanReadableFileName
        );
        await this.tagAsProcessed(originalFile);
      }
    } catch (e) {
      new Notice(
        `Error processing ${originalFile.basename}: ${e.message}`,
        3000
      );
    }
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

  // experimental meant to extend user capabilities
  async useCustomClassifier(content: string) {
    // const classifications = ["todos", "notes", "morning notes", "reminder"];
    const classifications = [
      { type: "todos", moveTo: "/todos" },
      { type: "notes", moveTo: "/notes" },
      { type: "morning notes", moveTo: "/morning-notes" },
      { type: "reminder", moveTo: "/reminders" },
    ];
    const whatTypeOfDocument = await useText(
      `Content:
				${content} 
				classifications:
				${classifications.join(",")},
				'", which of the following classifications would be the most appropriate?`,
      "Please respond with the name of the most appropriate classification from the provided list. If none of the classifications are suitable, respond with 'None'.",
      {
        baseUrl: this.settings.useCustomServer
          ? this.settings.customServerUrl
          : this.settings.defaultServerUrl,
        apiKey: this.settings.API_KEY,
      }
    );
    logMessage("This is closest to the following", whatTypeOfDocument);
    return whatTypeOfDocument;
  }

  async organizeFile(file: TFile, content: string) {
    const destinationFolder = await this.getAIClassifiedFolder(content, file);
    new Notice(`Most similar folder: ${destinationFolder}`, 3000);
    await this.moveContent(file, file.basename, destinationFolder);
  }

  async renameTagAndOrganize(file: TFile, content: string, fileName: string) {
    const destinationFolder = await this.getAIClassifiedFolder(content, file);
    new Notice(`Most similar folder: ${destinationFolder}`, 3000);
    await this.appendAlias(file, file.basename);
    await this.moveContent(file, fileName, destinationFolder);
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
  async appendAttachment(processedFile: TFile, attachmentFile: TFile) {
    logMessage("Appending attachment", attachmentFile);
    await this.app.vault.append(processedFile, `![[${attachmentFile.name}]]`);
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
      logMessage("Not appending aliases");
      return;
    }
    logMessage("Appending alias", alias);
    this.appendToFrontMatter(file, "alias", alias);
  }

  // creates a .md file with a humean readable name guessed from the content
  async createFileFromContent(content: string) {
    const now = new Date();
    const formattedNow = now.toISOString().replace(/[-:.TZ]/g, "");
    let name = formattedNow;
    try {
      name = await useName(content, {
        baseUrl: this.settings.useCustomServer
          ? this.settings.customServerUrl
          : this.settings.defaultServerUrl,
        apiKey: this.settings.API_KEY,
      });
    } catch (error) {
      console.error("Error processing file:", error.status);
      new Notice("Could not set a human readable name.");
    }
    const safeName = formatToSafeName(name);

    const outputFilePath = `/${this.settings.defaultDestinationPath}/${safeName}.md`;
    const file = await this.app.vault.create(outputFilePath, content);
    return file;
  }

  async moveContent(
    file: TFile,
    humanReadableFileName: string,
    destinationFolder = ""
  ) {
    new Notice(`Moving file to ${destinationFolder}`, 3000);
    await this.app.vault.rename(
      file,
      `${destinationFolder}/${humanReadableFileName}.${file.extension}`
    );
    await this.appendToCustomLogFile(
      `Organized [[${humanReadableFileName}]] into ${destinationFolder}`
    );
    return file;
  }

  async moveToDefaultAttachmentFolder(file: TFile, newFileName: string) {
    const destinationFolder = this.settings.attachmentsPath;
    const destinationPath = `${destinationFolder}/${newFileName}.${file.extension}`;
    await this.app.vault.rename(file, destinationPath);
    await this.appendToCustomLogFile(
      `Moved [[${newFileName}.${file.extension}]] to attachments`
    );
  }

  async generateNameFromContent(content: string): Promise<string> {
    const name = await useName(content, {
      baseUrl: this.settings.useCustomServer
        ? this.settings.customServerUrl
        : this.settings.defaultServerUrl,
      apiKey: this.settings.API_KEY,
    });
    const safeName = formatToSafeName(name);
    return safeName;
  }

  async generateTranscriptFromAudio(file: TFile) {
    new Notice(`Generating transcription for ${file.basename}`, 3000);
    // @ts-ignore
    const arrayBuffer = await this.app.vault.readBinary(file);
    const fileContent = Buffer.from(arrayBuffer);
    const encodedAudio = fileContent.toString("base64");
    logMessage(`Encoded: ${encodedAudio.substring(0, 20)}...`);

    const transcribedText = await useAudio(encodedAudio, {
      baseUrl: this.settings.useCustomServer
        ? this.settings.customServerUrl
        : this.settings.defaultServerUrl,
      apiKey: this.settings.API_KEY,
    });
    const postProcessedText = transcribedText;
    return postProcessedText;
  }

  async generateImageAnnotation(file: TFile, customPrompt?: string) {
    new Notice(`Generating annotation for ${file.basename}`, 3000);
    const arrayBuffer = await this.app.vault.readBinary(file);
    const fileContent = Buffer.from(arrayBuffer);
    const encodedImage = fileContent.toString("base64");
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
    const tags = this.app.metadataCache.getTags();
    // if tags is = {} return
    if (Object.keys(tags).length === 0) {
      logMessage("No tags found");
      return [];
    }

    logMessage("tags", tags);
    // 2. Pass all the tags to GPT-3 and get the most similar tags
    const tagNames = Object.keys(tags);
    const uniqueTags = [...new Set(tagNames)];

    logMessage("uniqueTags", uniqueTags);

    const data = {
      content,
      fileName,
      tags: uniqueTags,
    };

    const response = await requestUrl({
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
    });

    const result = await response.json;
    console.log(result, "test");
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
    logMessage("uniqueFolders", uniqueFolders);
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
      .filter((folder) => folder !== this.settings.pathToWatch);

    logMessage("uniqueFolders", uniqueFolders);

    const data = {
      content,
      fileName: file.basename,
      folders: uniqueFolders,
    };

    const response = await requestUrl({
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
    });

    const result = await response.json;
    const sanitizedFolderName = result.folder.replace(/[\\:*?"<>|]/g, "");

    if (sanitizedFolderName === "None") {
      destinationFolder = this.settings.defaultDestinationPath;
    }

    if (sanitizedFolderName !== "None") {
      destinationFolder = sanitizedFolderName;
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

    let logFile = this.app.vault.getAbstractFileByPath(logFilePath);
    if (!logFile) {
      logFile = await this.app.vault.create(logFilePath, "");
    }
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
    this.ensureFolderExists(this.settings.pathToWatch);
    this.addSettingTab(new FileOrganizerSettingTab(this.app, this));
    this.registerView(
      ASSISTANT_VIEW_TYPE,
      (leaf: WorkspaceLeaf) => new AssistantView(leaf, this)
    );
  }

  registerEventHandlers() {
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
      this.app.vault.on("rename", (file) => {
        if (!file.path.includes(this.settings.pathToWatch)) return;
        if (file instanceof TFile) {
          this.processFileV2(file);
        }
      })
    );
  }
}
