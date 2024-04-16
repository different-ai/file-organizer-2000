import {
  Plugin,
  Notice,
  TFolder,
  TFile,
  TAbstractFile,
  moment,
  WorkspaceLeaf,
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
  customVisionPrompt = ""; // default value is an empty string
  useAutoAppend = false;
  defaultServerUrl = "https://app.fileorganizer2000.com";
  customServerUrl = "https://file-organizer-2000.vercel.app/";
  useCustomServer = false;
}

const validAudioExtensions = ["mp3", "wav", "webm", "m4a"];
const validImageExtensions = ["png", "jpg", "jpeg", "gif", "svg"];
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
  async processFileV2(file: TFile) {
    try {
      new Notice(`Looking at ${file.basename}`, 3000);
      // commented out for testing
      this.validateAPIKey();
      if (!file.extension) return;
      if (!isValidExtension(file.extension)) return;

      await this.checkAndCreateFolders();
      // if it's a text file, get the content, if it's an image, get the annotation, if it's an audio file, get the transcription
      const text = await this.getTextFromFile(file);
      this.useCustomClassifier(text);

      if (validMediaExtensions.includes(file.extension)) {
        await this.handleMediaFile(file, text);
      } else {
        await this.handleNonMediaFile(file, text);
      }
    } catch (e) {
      new Notice(`Error processing ${file.basename}: ${e.message}`, 3000);
    }
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

  async handleMediaFile(file: TFile, content: string) {
    const baseName = file.basename;
    const humanReadableFileName = await this.generateNameFromContent(content);
    const fileToMove = await this.createFileFromContent(content);
    await this.moveToDefaultAttachmentFolder(file, humanReadableFileName);
    await this.appendAttachment(fileToMove, file);
    await this.renameTagAndOrganize(fileToMove, content, humanReadableFileName, baseName);
  }

  async handleNonMediaFile(file: TFile, content: string) {
    const baseName = file.basename;
    const humanReadableFileName = await this.generateNameFromContent(content);
    await this.renameTagAndOrganize(file, content, humanReadableFileName, baseName);
  }

  async organizeFile(file: TFile, content: string) {
    //console.log('organize file', file)
    const destinationFolder = await this.getAIClassifiedFolder(content, file);
    await this.moveContent(file, file.basename, destinationFolder);
  }

  async renameTagAndOrganize(file: TFile, content: string, fileName: string, baseName: string) {
    // console.log('renametagandorganize', fileName)
    const destinationFolder = await this.getAIClassifiedFolder(content, file);
    await this.appendAlias(file, file.basename);
    await this.appendSimilarTags(content, file, baseName);
    await this.moveContent(file, fileName, destinationFolder, baseName);
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

  async appendAlias(file: TFile, alias: string) {
    logMessage("Appending alias", alias);
    await this.app.fileManager.processFrontMatter(file, (frontmatter) => {
      if (!frontmatter.hasOwnProperty("alias")) {
        frontmatter["alias"] = [];
      }
      if (!Array.isArray(frontmatter["alias"])) {
        frontmatter["alias"] = [frontmatter["alias"]];
      }
      frontmatter["alias"].push(alias);
    });
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
    destinationFolder = "",
    baseName?: string
  ) {
    new Notice(`Moving file to ${destinationFolder}`, 3000);
    await this.app.vault.rename(
      file,
      `${destinationFolder}/${humanReadableFileName}.${file.extension}`
    );
    await this.appendToCustomLogFile(
      `Organized [[${baseName}.${file.extension}]] into ${destinationFolder} as [[${humanReadableFileName}.${file.extension}]]`
    );
    return file;
  }

  async moveToDefaultAttachmentFolder(file: TFile, newFileName: string) {
    const destinationFolder = this.settings.attachmentsPath;
    const destinationPath = `${destinationFolder}/${newFileName}.${file.extension}`;
    const originalFileName = `${file.basename}.${file.extension}`;
    await this.app.vault.rename(file, destinationPath);
    this.appendToCustomLogFile(
      `Moved [[${originalFileName}]] to attachments`
    );
  }

  async generateNameFromContent(content: string): Promise<string> {
    new Notice(`Generating name for ${content.substring(0, 20)}...`, 3000);
    const name = await useName(content, {
      baseUrl: this.settings.useCustomServer
        ? this.settings.customServerUrl
        : this.settings.defaultServerUrl,
      apiKey: this.settings.API_KEY,
    });
    const safeName = formatToSafeName(name);
    new Notice(`Generated name: ${safeName}`, 3000);
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
    this.appendToCustomLogFile(
      `Generated transcription for [[${file.basename}.${file.extension}]]`
    );

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
    this.appendToCustomLogFile(
      `Generated annotation for [[${file.basename}.${file.extension}]]`
    );
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

    // Prepare the prompt for GPT-4
    const prompt = `Given the text "${content}" (and if relevant ${fileName}), which of the following tags are the most relevant? ${uniqueTags.join(
      ", "
    )}`;
    const mostSimilarTags = await useText(
      prompt,
      "Always answer with a list of tag names from the provided list. If none of the tags are relevant, answer with an empty list.",
      {
        baseUrl: this.settings.useCustomServer
          ? this.settings.customServerUrl
          : this.settings.defaultServerUrl,
        apiKey: this.settings.API_KEY,
      }
    );
    // Extract the most similar tags from the response

    console.log("mostSimilarTags", mostSimilarTags);
    return (
      mostSimilarTags
        // remove all special characters except # to avoid having tags item listed with - or other special characters
        .replace(/[^a-zA-Z0-9# ]/g, "")
        .split(" ")
        // .split(",")
        .map((tag: string) => tag.trim())
        .filter((tag: string) => !content.includes(tag))
    );
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

    // Get the most similar folder based on the content and file name
    const mostSimilarFolder = await useText(
      `Given the text content "${content}" (and if the file name "${file.basename
      }"), which of the following folders would be the most appropriate location for the file? Available folders: ${uniqueFolders.join(
        ", "
      )}`,
      "Please respond with the name of the most appropriate folder from the provided list. If none of the folders are suitable, respond with 'None'.",
      {
        baseUrl: this.settings.useCustomServer
          ? this.settings.customServerUrl
          : this.settings.defaultServerUrl,
        apiKey: this.settings.API_KEY,
      }
    );
    logMessage("mostSimilarFolder", mostSimilarFolder);
    new Notice(`Most similar folder: ${mostSimilarFolder}`, 3000);

    // Extract the most similar folder from the response
    const sanitizedFolderName = mostSimilarFolder.replace(/[\\:*?"<>|]/g, "");

    // If no similar folder is found, set the destination folder as the default destination path
    if (sanitizedFolderName === "None") {
      destinationFolder = this.settings.defaultDestinationPath;
    }

    // If a similar folder is found, set the destination folder as the most similar folder
    if (sanitizedFolderName !== "None") {
      destinationFolder = sanitizedFolderName;
    }

    // Return the determined destination folder
    return destinationFolder;
  }

  async appendSimilarTags(content: string, file: TFile, baseName?: string) {
    if (!this.settings.useSimilarTags) {
      return;
    }
    //console.log(file)
    //console.log('file base', file.basename)
    // console.log('file name', file.name)
    // Get similar tags
    const similarTags = await this.getSimilarTags(content, file.basename);

    // Append similar tags
    if (similarTags.length > 0) {
      this.appendToCustomLogFile(`Added similar tags to [[${baseName}.${file.extension}]]`);
      await this.app.vault.append(file, `\n${similarTags.join(" ")}`);
      new Notice(`Added similar tags to ${file.basename}`, 3000);
      return;
    }
    new Notice(`No similar tags found`, 3000);
  }

  async getMostSimilarFileByName(
    content: string,
    currentFile: TFile
  ): Promise<TFile> {
    const allMarkdownFiles = this.app.vault.getMarkdownFiles();
    const allMarkdownFilePaths = allMarkdownFiles
      .filter((file) => file.path !== currentFile.path) // Ignore the current file
      .map((file) => file.path);

    // Get the most similar file based on the content
    const mostSimilarFile = await useText(
      `Given the request of the user to append it in a certain file in "${content}", which of the following files would match the user request the most? Available files: ${allMarkdownFilePaths.join(
        ","
      )}`,
      "Please only respond with the full path of the most appropriate file from the provided list.",
      {
        baseUrl: this.settings.useCustomServer
          ? this.settings.customServerUrl
          : this.settings.defaultServerUrl,
        apiKey: this.settings.API_KEY,
      }
    );

    // Extract the most similar file from the response
    const sanitizedFileName = mostSimilarFile.replace(/[\\:*?"<>|]/g, "");

    const file = this.app.vault.getAbstractFileByPath(sanitizedFileName);
    if (!file) {
      throw new Error(`Could not find file with path ${sanitizedFileName}`);
    }
    if (!(file instanceof TFile)) {
      throw new Error(
        `File with path ${sanitizedFileName} is not a markdown file`
      );
    }
    return file;
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

  async appendToSimilarFile(incomingFile: TFile) {
    try {
      new Notice(`Processing incoming file ${incomingFile.basename}`, 3000);
      const content = await this.getTextFromFile(incomingFile);
      const similarFile = await this.getMostSimilarFileByName(
        content,
        incomingFile
      );

      if (similarFile) {
        await this.app.vault.append(similarFile, `\n${content}`);
        new Notice(
          `Appended content to similar file: ${similarFile.basename}`,
          3000
        );
        this.appendToCustomLogFile(
          `Appended content from [[${incomingFile.basename}]] to similar file [[${similarFile.basename}]]`
        );
      } else {
        new Notice(`No similar file found for ${incomingFile.basename}`, 3000);
      }
    } catch (error) {
      console.error("Error appending to similar file:", error);
      new Notice("Error processing incoming file.");
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

    this.addCommand({
      id: "append-to-similar-file",
      name: "Append to similar file",
      callback: async () => {
        const activeFile = this.app.workspace.getActiveFile();
        if (activeFile) {
          await this.appendToSimilarFile(activeFile);
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
