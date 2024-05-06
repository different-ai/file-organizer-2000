import {
  Plugin,
  Notice,
  TFolder,
  TFile,
  TAbstractFile,
  moment,
  WorkspaceLeaf,
  requestUrl,
} from "obsidian";
import useVision from "./modules/vision";
import useAudio from "./modules/audio";
import { logMessage, formatToSafeName } from "../utils";
import { FileOrganizerSettingTab } from "./FileOrganizerSettingTab";
import { ASSISTANT_VIEW_TYPE, AssistantViewWrapper } from "./AssistantView";
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

  OPENAI_API_KEY = "";
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
  async processFileV2(originalFile: TFile) {
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

      let humanReadableFileName = originalFile.basename;

      if (this.shouldRename(originalFile)) {
        new Notice(`Generating name for ${text.substring(0, 20)}...`, 3000);
        humanReadableFileName = await this.generateNameFromContent(text);
      }

      let processedFile = originalFile;

      if (validMediaExtensions.includes(originalFile.extension)) {
        const annotatedFile = await this.createFileFromContent(text);
        this.appendToCustomLogFile(
          `Generated annotation for [[${annotatedFile.basename}]]`
        );

        await this.moveToDefaultAttachmentFolder(
          originalFile,
          humanReadableFileName
        );
        await this.appendAttachment(annotatedFile, originalFile);
        processedFile = annotatedFile;
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

      await this.renameTagAndOrganize(
        processedFile,
        text,
        humanReadableFileName
      );
      await this.tagAsProcessed(processedFile);
    } catch (e) {
      new Notice(`Error processing ${originalFile.basename}`, 3000);
      new Notice(e.message, 6000);
      console.error(e);
    }
  }
  shouldRename(file: TFile): boolean {
    const isRenameEnabled = this.settings.renameDocumentTitle;
    const isUntitledFile = /^untitled/i.test(file.basename);

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
    logMessage("classifications", classifications);
    const response = await makeApiRequest(() =>
      requestUrl({
        url: `${
          this.settings.useCustomServer
            ? this.settings.customServerUrl
            : this.settings.defaultServerUrl
        }/api/folders`,
        method: "POST",
        body: JSON.stringify({
          content,
          fileName: name,
          folders: classifications.map((c) => c.type),
        }),
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.settings.API_KEY}`,
        },
      })
    );
    const { folder: whatTypeOfDocument } = await response.json;

    logMessage("whatTypeOfDocument", whatTypeOfDocument);

    const selectedClassification = classifications.find(
      (c) => c.type.toLowerCase() === whatTypeOfDocument.toLowerCase()
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
    await this.moveContent(file, file.basename, destinationFolder);
  }

  // let's unpack this into processFileV2
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
      return;
    }
    this.appendToFrontMatter(file, "alias", alias);
  }

  // creates a .md file with a humean readable name guessed from the content
  async createFileFromContent(content: string) {
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

    const outputFilePath = `/${this.settings.defaultDestinationPath}/${safeName}.md`;
    const file = await this.app.vault.create(outputFilePath, content);
    return file;
  }

  async moveContent(
    file: TFile,
    humanReadableFileName: string,
    destinationFolder = ""
  ) {
    new Notice(`Moving file to ${destinationFolder} folder`, 3000);
    await this.app.vault.rename(
      file,
      `${destinationFolder}/${humanReadableFileName}.${file.extension}`
    );
    await this.appendToCustomLogFile(
      `Organized [[${humanReadableFileName}]] into ${destinationFolder}`
    );
    return file;
  }

  async getSimilarFiles(fileToCheck: TFile): Promise<string[]> {
    if (!fileToCheck) {
      console.log("No active file found.");
      return [];
    }

    const activeFileContent = await this.app.vault.read(fileToCheck);
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
      .filter((file: string) => !file.includes(this.settings.templatePaths));

    return similarFiles;
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
    this.ensureFolderExists(this.settings.templatePaths);
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

    // 2. Pass all the tags to GPT-3 and get the most similar tags
    const tagNames = Object.keys(tags);
    const uniqueTags = [...new Set(tagNames)];

    const data = {
      content,
      fileName,
      tags: uniqueTags,
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
      .filter((folder) => folder !== this.settings.templatePaths);

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

    if (!this.settings.API_KEY && !this.settings.OPENAI_API_KEY) {
      throw new Error(
        "Please enter your API Key or OpenAI API Key in the settings of the FileOrganizer plugin."
      );
    }
  }

  // native

  async onload() {
    await this.initializePlugin();

    // add commands
    this.addCommand({
      id: "find-similar-files",
      name: "Find Similar Files",
      callback: async () => {
        const activeFile = this.app.workspace.getActiveFile();
        if (!activeFile) {
          console.log("No active file found.");
          return;
        }
        const similarFiles = await this.getSimilarFiles(activeFile);
        console.log("Most similar files:", similarFiles);
        // Display the similar files in the UI or perform further actions
      },
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
      this.app.vault.on("rename", (file) => {
        if (!file.path.includes(this.settings.pathToWatch)) return;
        if (file instanceof TFile) {
          this.processFileV2(file);
        }
      })
    );
  }
}
