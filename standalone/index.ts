/// standalone
// ignore file for ts
import fs from "fs";
import path from "path";
import { promisify } from "util";
import moment from "moment";
import Jimp from "jimp";
import chokidar from "chokidar";
// import fetch from "node-fetch";
// import { PDFDocument } from "pdf-lib";

const readFile = promisify(fs.readFile);
const writeFile = promisify(fs.writeFile);
const mkdir = promisify(fs.mkdir);
const exists = promisify(fs.exists);
const rename = promisify(fs.rename);

const folderToWatch = process.argv[2];

class FileOrganizerSettings {
  API_KEY = "";
  useLogs = true;
  defaultDestinationPath = `${folderToWatch}/Processed`;
  attachmentsPath = `${folderToWatch}/Processed/Attachments`;
  // should be path to watch inbox
  pathToWatch = `${folderToWatch}/Inbox`;
  logFolderPath = `${folderToWatch}/Logs`;
  useSimilarTags = true;
  renameDocumentTitle = false;
  useAliases = false;
  useAutoAppend = false;
  defaultServerUrl = "https://app.fileorganizer2000.com";
  customServerUrl = "http://localhost:3000";
  useCustomServer = true;
  useSimilarTagsInFrontmatter = false;
  enableEarlyAccess = false;
  earlyAccessCode = "";
  processedTag = false;
  templatePaths = `${folderToWatch}/Templates`;
  enableDocumentClassification = false;
  renameUntitledOnly = false;
  ignoreFolders = ["_FileOrganizer2000"];
  stagingFolder = ".fileorganizer2000/staging";
  disableImageAnnotation = true;
}

const validAudioExtensions = ["mp3", "wav", "webm", "m4a"];
const validImageExtensions = ["png", "jpg", "jpeg", "gif", "svg", "webp"];
const validMediaExtensions = [...validAudioExtensions, ...validImageExtensions];
const validTextExtensions = ["md", "txt"];
const validExtensions = [
  ...validMediaExtensions,
  ...validTextExtensions,
  "pdf",
];

const isValidExtension = (extension: string) => {
  if (!validExtensions.includes(extension)) {
    console.log("Sorry, FileOrganizer does not support this file type.");
    return false;
  }
  return true;
};

async function makeApiRequest<T>(requestFn: () => Promise<T>): Promise<T> {
  try {
    return await requestFn();
  } catch (error) {
    console.error("API request error:", error);
    // @ts-ignore
    if (error.status === 429) {
      console.log("You have run out of credits. Please upgrade your plan.");
    } else {
      console.log("An error occurred while processing the request.");
      console.error("API request error:", error);
    }
    throw error;
  }
}

class FileOrganizer {
  settings: FileOrganizerSettings;

  constructor(settings: FileOrganizerSettings) {
    this.settings = settings;
  }

  async processFileV2(originalFilePath: string, oldPath?: string) {
    try {
      console.log(`Looking at ${path.basename(originalFilePath)}`);
      this.validateAPIKey();

      const fileExtension = path.extname(originalFilePath).slice(1);

      // if ds store ignore
      if (path.basename(originalFilePath) === ".DS_Store") {
        return;
      }
      if (!isValidExtension(fileExtension)) {
        return;
      }

      await this.checkAndCreateFolders();

      const text = await this.getTextFromFile(originalFilePath);

      let documentName = path.basename(
        originalFilePath,
        path.extname(originalFilePath)
      );

      console.log(`Generating name for ${text.substring(0, 20)}...`);
      documentName = await this.generateNameFromContent(text);
      let processedFilePath = originalFilePath;

      if (validMediaExtensions.includes(fileExtension)) {
        const attachmentFilePath = originalFilePath;
        if (
          this.settings.disableImageAnnotation &&
          validImageExtensions.includes(fileExtension)
        ) {
          const destinationFolder = await this.getAIClassifiedFolder(
            text,
            processedFilePath
          );
          await this.moveFile(
            attachmentFilePath,
            documentName,
            destinationFolder
          );
          await this.appendToCustomLogFile(
            `Moved [[${documentName}${path.extname(
              attachmentFilePath
            )}]] to ${destinationFolder}`
          );
          return;
        } else {
          const annotatedMarkdownFilePath =
            await this.createMarkdownFileFromText(text);
          console.log("annotatedMarkdownFilePath", annotatedMarkdownFilePath);
          await this.moveToAttachmentFolder(attachmentFilePath, documentName);
          console.log("moved to attachment folder");
          await this.appendAttachment(
            annotatedMarkdownFilePath,
            attachmentFilePath
          );
          console.log("appended attachment");
          processedFilePath = annotatedMarkdownFilePath;
          this.appendToCustomLogFile(
            `Generated annotation for [[${path.basename(
              annotatedMarkdownFilePath
            )}]]`
          );
        }
      }

      if (this.settings.enableDocumentClassification) {
        const classification = await this.classifyAndFormatDocument(
          processedFilePath,
          text
        );
        classification &&
          this.appendToCustomLogFile(
            `Classified [[${path.basename(processedFilePath)}]] as ${
              classification.type
            }`
          );
      }

      const destinationFolder = await this.getAIClassifiedFolder(
        text,
        processedFilePath
      );
      console.log(`Most similar folder: ${destinationFolder}`);
      await this.appendAlias(
        processedFilePath,
        path.basename(processedFilePath, path.extname(processedFilePath))
      );
      const movedFilePath = await this.moveFile(
        processedFilePath,
        documentName,
        destinationFolder
      );
      await this.appendToCustomLogFile(
        `Organized [[${path.basename(
          movedFilePath
        )}]] into ${destinationFolder}`
      );

      await this.appendSimilarTags(text, movedFilePath);

      await this.tagAsProcessed(movedFilePath);
    } catch (error) {
      // @ts-ignore
      console.log(`Error processing ${path.basename(originalFilePath)}`);
      // @ts-ignore
      console.log(error.message);
      // @ts-ignore
      console.error(error);
    }
  }

  shouldRename(filePath: string): boolean {
    const isRenameEnabled = this.settings.renameDocumentTitle;
    const isUntitledFile = /^untitled/i.test(
      path.basename(filePath, path.extname(filePath))
    );

    if (path.extname(filePath) !== ".md") {
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

  async classifyAndFormatDocument(filePath: string, content: string) {
    const classification = await this.classifyContent(
      content,
      path.basename(filePath)
    );

    if (classification) {
      await this.formatContent(filePath, content, classification);
      return classification;
    }
    return null;
  }

  async tagAsProcessed(filePath: string) {
    if (!this.settings.processedTag) {
      return;
    }
    const tag = "#fo2k";
    this.appendTag(filePath, tag);
  }

  async getClassifications(): Promise<
    { type: string; formattingInstruction: string }[]
  > {
    const templateFolderPath = this.settings.templatePaths;

    if (!fs.existsSync(templateFolderPath)) {
      console.error("Template folder not found or is not a valid folder.");
      return [];
    }

    const templateFiles = fs
      .readdirSync(templateFolderPath)
      .filter((file) => path.extname(file) === ".md");

    const classifications = await Promise.all(
      templateFiles.map(async (file) => ({
        type: path.basename(file, path.extname(file)),
        formattingInstruction: await readFile(
          path.join(templateFolderPath, file),
          "utf8"
        ),
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
      fetch(
        `${
          this.settings.useCustomServer
            ? this.settings.customServerUrl
            : this.settings.defaultServerUrl
        }/api/classify`,
        {
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
        }
      )
    );
    // @ts-ignore
    const { documentType } = await response.json();

    const selectedClassification = classifications.find(
      (c) => c.type.toLowerCase() === documentType.toLowerCase()
    );

    return selectedClassification || null;
  }

  async formatContent(
    filePath: string,
    fileContent: string,
    selectedClassification: { type: string; formattingInstruction: string }
  ) {
    const response = await makeApiRequest(() =>
      fetch(
        `${
          this.settings.useCustomServer
            ? this.settings.customServerUrl
            : this.settings.defaultServerUrl
        }/api/text`,
        {
          method: "POST",
          body: JSON.stringify({
            content: fileContent,
            formattingInstruction: selectedClassification.formattingInstruction,
          }),
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${this.settings.API_KEY}`,
          },
        }
      )
    );
    // @ts-ignore
    const { message } = await response.json();

    await writeFile(filePath, message, "utf8");
  }

  async organizeFile(filePath: string, content: string) {
    const destinationFolder = await this.getAIClassifiedFolder(
      content,
      filePath
    );
    console.log(`Most similar folder: ${destinationFolder}`);
    await this.moveFile(filePath, path.basename(filePath), destinationFolder);
  }

  async renameTagAndOrganize(
    filePath: string,
    content: string,
    fileName: string
  ) {
    const destinationFolder = await this.getAIClassifiedFolder(
      content,
      filePath
    );
    console.log(`Most similar folder: ${destinationFolder}`);
    await this.appendAlias(
      filePath,
      path.basename(filePath, path.extname(filePath))
    );
    await this.moveFile(filePath, fileName, destinationFolder);
    await this.appendSimilarTags(content, filePath);
  }

  async createBackup(filePath: string) {
    const destinationFolder = this.settings.defaultDestinationPath;
    const destinationPath = `${destinationFolder}/${path.basename(filePath)}`;
    await fs.promises.copyFile(filePath, destinationPath);
    this.appendToCustomLogFile(
      `Backed Up [[${path.basename(filePath)}]] to ${destinationPath}`
    );
  }

  async getTextFromFile(filePath: string): Promise<string> {
    let content = "";
    const fileExtension = path.extname(filePath).slice(1);

    if (fileExtension === "md") {
      content = await readFile(filePath, "utf8");
    } else if (validImageExtensions.includes(fileExtension)) {
      content = await this.generateImageAnnotation(filePath);
    } else if (validAudioExtensions.includes(fileExtension)) {
      content = await this.generateTranscriptFromAudio(filePath);
    } else if (fileExtension === "pdf") {
      // content = await this.extractTextFromPDF(filePath);
    }

    return content;
  }
  // async extractTextFromPDF(filePath: string): Promise<string> {
  //   try {
  //     const pdfBytes = await readFile(filePath);
  //     const pdfDoc = await PDFDocument.load(pdfBytes);
  //     const pageTextPromises = pdfDoc.getPages().map(async (page) => {
  //       const textContent = await page.getTextContent();
  //       return textContent.items.map((item) => item.str).join(" ");
  //     });
  //     const pageTexts = await Promise.all(pageTextPromises);
  //     return pageTexts.join("\n");
  //   } catch (error) {
  //     console.error(`Error extracting text from PDF: ${error}`);
  //     return "";
  //   }
  // }

  async appendAttachment(markdownFilePath: string, attachmentFilePath: string) {
    await fs.promises.appendFile(
      markdownFilePath,
      `\n![[${path.basename(attachmentFilePath)}]]`
    );
  }

  async appendToFrontMatter(filePath: string, key: string, value: string) {
    const fileContent = await readFile(filePath, "utf8");
    const frontMatterRegex = /---\n([\s\S]*?)\n---/;
    const match = fileContent.match(frontMatterRegex);

    let updatedContent = fileContent;

    if (match) {
      const frontMatter = match[1];
      const lines = frontMatter.split("\n");
      const keyIndex = lines.findIndex((line) => line.startsWith(`${key}:`));

      if (keyIndex !== -1) {
        const keyLine = lines[keyIndex];
        const values = keyLine
          .slice(key.length + 1)
          .trim()
          .split(",");
        if (!values.includes(value)) {
          values.push(value);
          lines[keyIndex] = `${key}: ${values.join(", ")}`;
        }
      } else {
        lines.push(`${key}: ${value}`);
      }

      const updatedFrontMatter = lines.join("\n");
      updatedContent = fileContent.replace(
        frontMatterRegex,
        `---\n${updatedFrontMatter}\n---`
      );
    } else {
      updatedContent = `---\n${key}: ${value}\n---\n${fileContent}`;
    }

    await writeFile(filePath, updatedContent, "utf8");
  }

  async appendAlias(filePath: string, alias: string) {
    if (!this.settings.useAliases) {
      return;
    }
    this.appendToFrontMatter(filePath, "alias", alias);
  }

  async createMarkdownFileFromText(content: string) {
    const now = new Date();
    const formattedNow = now.toISOString().replace(/[-:.TZ]/g, "");
    let name = formattedNow;
    try {
      name = await this.generateNameFromContent(content);
    } catch (error) {
      // @ts-ignore
      console.error("Error processing file:", error.status);
      // @ts-ignore
      console.log("Could not set a human readable name.");
    }
    const safeName = formatToSafeName(name);

    let outputFilePath = `${this.settings.defaultDestinationPath}/${safeName}.md`;

    if (fs.existsSync(outputFilePath)) {
      const timestamp = Date.now();
      const timestampedFileName = `${safeName}_${timestamp}`;
      outputFilePath = `${this.settings.defaultDestinationPath}/${timestampedFileName}.md`;
    }
    await writeFile(outputFilePath, content, "utf8");
    return outputFilePath;
  }

  async moveFile(
    filePath: string,
    humanReadableFileName: string,
    destinationFolder = ""
  ) {
    console.log(`Moving file to ${destinationFolder} folder`);
    const fileExtension = path.extname(filePath);
    let destinationPath = path.join(
      folderToWatch,
      destinationFolder,
      `${humanReadableFileName}${fileExtension}`
    );
    console.log(`Destination path: ${destinationPath}`);

    if (fs.existsSync(destinationPath)) {
      await this.appendToCustomLogFile(
        `File [[${humanReadableFileName}]] already exists. Renaming to [[${humanReadableFileName}]]`
      );
      const timestamp = Date.now();
      const timestampedFileName = `${humanReadableFileName}_${timestamp}`;
      destinationPath = `${destinationFolder}/${timestampedFileName}${fileExtension}`;
      destinationPath = path.join(folderToWatch, destinationPath);
    }
    await this.ensureFolderExists(path.join(folderToWatch, destinationFolder));
    await rename(filePath, destinationPath);
    return destinationPath;
  }

  async getSimilarFiles(fileToCheck: string): Promise<string[]> {
    if (!fileToCheck) {
      return [];
    }

    const activeFileContent = await readFile(fileToCheck, "utf8");
    const settingsPaths = [
      this.settings.pathToWatch,
      this.settings.defaultDestinationPath,
      this.settings.attachmentsPath,
      this.settings.logFolderPath,
      this.settings.templatePaths,
    ];
    const allFiles = await this.getAllMarkdownFiles();
    const allFilesFiltered = allFiles.filter(
      (file) =>
        !settingsPaths.some((path) => file.includes(path)) &&
        file !== fileToCheck
    );

    const fileContents = await Promise.all(
      allFilesFiltered.map(async (file) => ({
        name: file,
      }))
    );

    const data = {
      activeFileContent,
      files: fileContents,
    };

    const response = await makeApiRequest(() =>
      fetch(
        `${
          this.settings.useCustomServer
            ? this.settings.customServerUrl
            : this.settings.defaultServerUrl
        }/api/relationships`,
        {
          method: "POST",
          body: JSON.stringify(data),
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${this.settings.API_KEY}`,
          },
        }
      )
    );

    const result = await response.json();
    // @ts-ignore
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

  async moveToAttachmentFolder(filePath: string, newFileName: string) {
    const destinationFolder = this.settings.attachmentsPath;
    await this.moveFile(filePath, newFileName, destinationFolder);
    await this.appendToCustomLogFile(
      `Moved [[${newFileName}${path.extname(filePath)}]] to attachments`
    );
  }

  async generateNameFromContent(content: string): Promise<string> {
    const response = await makeApiRequest(() =>
      fetch(
        `${
          this.settings.useCustomServer
            ? this.settings.customServerUrl
            : this.settings.defaultServerUrl
        }/api/name`,
        {
          method: "POST",
          body: JSON.stringify({ document: content }),
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${this.settings.API_KEY}`,
          },
        }
      )
    );

    const data = await response.json();
    // @ts-ignore
    const safeName = formatToSafeName(data.name);
    return safeName;
  }

  async generateTranscriptFromAudio(filePath: string) {
    console.log(
      `Generating transcription for ${path.basename(
        filePath
      )} this can take up to a minute`
    );

    try {
      const fileSize = fs.statSync(filePath).size;
      if (fileSize > 2500000) {
        console.log(
          `We do not support files transcripts for files bigger than 25M atm`
        );
        return;
      }
      const fileContent = await readFile(filePath);
      const encodedAudio = fileContent.toString("base64");

      const endpoint = "api/audio";
      const url = `${
        this.settings.useCustomServer
          ? this.settings.customServerUrl
          : this.settings.defaultServerUrl
      }/${endpoint}`;
      const result = await makeApiRequest(() =>
        fetch(url, {
          method: "POST",
          body: JSON.stringify({
            file: encodedAudio,
            extension: path.extname(filePath).slice(1),
          }),
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${this.settings.API_KEY}`,
          },
        })
      );
      const data = await result.json();
      // @ts-ignore
      const postProcessedText = data.transcription;
      return postProcessedText;
    } catch (e) {
      console.error("Error generating transcript", e);
      console.log("Error generating transcript");
      return "";
    }
  }

  async compressImage(fileContent: Buffer): Promise<Buffer> {
    const image = await Jimp.read(fileContent);

    if (image.getWidth() > 1000 || image.getHeight() > 1000) {
      image.scaleToFit(1000, 1000);
    }

    const resizedImage = await image.getBufferAsync(Jimp.MIME_PNG);
    return resizedImage;
  }

  isWebP(fileContent: Buffer): boolean {
    return (
      fileContent.slice(0, 4).toString("hex") === "52494646" &&
      fileContent.slice(8, 12).toString("hex") === "57454250"
    );
  }

  async generateImageAnnotation(filePath: string, customPrompt?: string) {
    console.log(
      `Generating annotation for ${path.basename(
        filePath
      )} this can take up to a minute`
    );

    const fileContent = await readFile(filePath);
    const imageSize = fileContent.byteLength;
    const imageSizeInMB = imageSize / (1024 * 1024);
    console.log(`Image size: ${imageSizeInMB.toFixed(2)} MB`);

    let encodedImage: string;

    if (!this.isWebP(fileContent)) {
      const resizedImage = await this.compressImage(fileContent);
      encodedImage = resizedImage.toString("base64");
    } else {
      encodedImage = fileContent.toString("base64");
    }

    const imageSizeInBytes = Buffer.byteLength(encodedImage, "base64");
    const imageSizeInMBAfterCompression = imageSizeInBytes / (1024 * 1024);
    console.log(
      `Image size after compression: ${imageSizeInMBAfterCompression.toFixed(
        2
      )} MB`
    );

    const processedContent = await useVision(encodedImage, customPrompt, {
      baseUrl: this.settings.useCustomServer
        ? this.settings.customServerUrl
        : this.settings.defaultServerUrl,
      apiKey: this.settings.API_KEY,
    });

    return processedContent;
  }

  async ensureFolderExists(folderPath: string) {
    if (!fs.existsSync(folderPath)) {
      await mkdir(folderPath, { recursive: true });
    }
  }

  async checkAndCreateFolders() {
    this.ensureFolderExists(this.settings.pathToWatch);
    this.ensureFolderExists(this.settings.defaultDestinationPath);
    this.ensureFolderExists(this.settings.attachmentsPath);
    this.ensureFolderExists(this.settings.logFolderPath);
    this.ensureFolderExists(this.settings.templatePaths);
    this.ensureFolderExists(this.settings.stagingFolder);
  }

  async getBacklog() {
    const allFiles = await this.getAllFilesInDirectory(
      this.settings.pathToWatch
    );
    return allFiles;
  }

  async processBacklog() {
    const pendingFiles = await this.getBacklog();
    for (const file of pendingFiles) {
      await this.processFileV2(file);
    }
  }

  async getSimilarTags(content: string, fileName: string): Promise<string[]> {
    const tags: string[] = await this.getAllTags();

    if (tags.length === 0) {
      console.log("No tags found");
      return [];
    }

    const data = {
      content,
      fileName,
      tags: tags,
    };

    const response = await makeApiRequest(() =>
      fetch(
        `${
          this.settings.useCustomServer
            ? this.settings.customServerUrl
            : this.settings.defaultServerUrl
        }/api/tagging`,
        {
          method: "POST",
          body: JSON.stringify(data),
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${this.settings.API_KEY}`,
          },
        }
      )
    );

    const result = await response.json();
    // @ts-ignore
    return result.tags;
  }

  async getAllFolders(): Promise<string[]> {
    const allFiles = await this.getAllFilesInDirectory(folderToWatch);
    const folderPaths = allFiles
      .filter((file) => fs.statSync(file).isDirectory())
      .map((folder) => folder);

    const uniqueFolders = [...new Set(folderPaths)];
    return uniqueFolders;
  }

  async getAIClassifiedFolder(
    content: string,
    filePath: string
  ): Promise<string> {
    let destinationFolder = "None";

    const uniqueFolders = await this.getAllFolders();
    const filteredFolders = uniqueFolders
      .filter((folder) => folder !== path.dirname(filePath))
      .filter((folder) => folder !== this.settings.defaultDestinationPath)
      .filter((folder) => folder !== this.settings.attachmentsPath)
      .filter((folder) => folder !== this.settings.logFolderPath)
      .filter((folder) => folder !== this.settings.pathToWatch)
      .filter((folder) => folder !== this.settings.templatePaths)
      .filter((folder) => !this.settings.ignoreFolders.includes(folder))
      .filter((folder) => folder !== "/");

    const data = {
      content,
      fileName: path.basename(filePath),
      folders: filteredFolders,
    };

    const response = await makeApiRequest(() =>
      fetch(
        `${
          this.settings.useCustomServer
            ? this.settings.customServerUrl
            : this.settings.defaultServerUrl
        }/api/folders`,
        {
          method: "POST",
          body: JSON.stringify(data),
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${this.settings.API_KEY}`,
          },
        }
      )
    );

    const result = await response.json();

    // @ts-ignore
    if (result.folder === "None") {
      destinationFolder = this.settings.defaultDestinationPath;
    } else {
      // @ts-ignore
      destinationFolder = result.folder;
    }

    return destinationFolder;
  }

  async appendTag(filePath: string, tag: string) {
    if (this.settings.useSimilarTagsInFrontmatter) {
      await this.appendToFrontMatter(filePath, "tags", tag);
      return;
    }
    await fs.promises.appendFile(filePath, `\n${tag}`);
  }

  async appendSimilarTags(content: string, filePath: string) {
    if (!this.settings.useSimilarTags) {
      return;
    }
    const similarTags = await this.getSimilarTags(
      content,
      path.basename(filePath)
    );

    if (similarTags.length === 0) {
      console.log(`No similar tags found`);
      return;
    }
    similarTags.forEach(async (tag) => {
      await this.appendTag(filePath, tag);
    });

    await this.appendToCustomLogFile(
      `Added similar tags to [[${path.basename(filePath)}]]`
    );
    console.log(`Added similar tags to ${path.basename(filePath)}`);
    return;
  }

  async appendToCustomLogFile(contentToAppend: string, action = "") {
    if (!this.settings.useLogs) {
      return;
    }
    const now = new Date();
    const formattedDate = moment(now).format("YYYY-MM-DD");
    const logFilePath = `${this.settings.logFolderPath}/${formattedDate}.md`;

    if (!fs.existsSync(logFilePath)) {
      await writeFile(logFilePath, "", "utf8");
    }

    const formattedTime =
      now.getHours().toString().padStart(2, "0") +
      ":" +
      now.getMinutes().toString().padStart(2, "0");
    const contentWithLink = `\n - ${formattedTime} ${contentToAppend}`;
    await fs.promises.appendFile(logFilePath, contentWithLink);
  }

  validateAPIKey() {
    if (this.settings.useCustomServer) {
      return true;
    }

    if (!this.settings.API_KEY) {
      throw new Error(
        "Please enter your API Key in the settings of the FileOrganizer plugin."
      );
    }
  }

  async getAllMarkdownFiles(): Promise<string[]> {
    const files = await this.getAllFilesInDirectory(".");
    return files.filter((file) => path.extname(file) === ".md");
  }

  async getAllFilesInDirectory(directory: string): Promise<string[]> {
    const entries = await fs.promises.readdir(directory, {
      withFileTypes: true,
    });

    const files = entries
      .filter((file) => !file.isDirectory())
      .map((file) => path.join(directory, file.name));

    const folders = entries.filter((folder) => folder.isDirectory());

    for (const folder of folders) {
      files.push(
        ...(await this.getAllFilesInDirectory(
          path.join(directory, folder.name)
        ))
      );
    }

    return files;
  }

  async getAllTags(): Promise<string[]> {
    const markdownFiles = await this.getAllMarkdownFiles();
    const tags: Set<string> = new Set();

    for (const file of markdownFiles) {
      const content = await readFile(file, "utf8");
      const tagRegex = /#(\w+)/g;
      let match;
      while ((match = tagRegex.exec(content)) !== null) {
        tags.add(match[0]);
      }
    }

    return Array.from(tags);
  }
}

function formatToSafeName(format: string) {
  return format.replace(/[\\/:"]/g, "");
}

async function useVision(
  encodedImage: string,
  systemPrompt = "Extract text from image. Write in markdown. If there's a drawing, describe it.",
  { baseUrl, apiKey }: { baseUrl: string; apiKey: string }
) {
  const jsonPayload = { image: encodedImage };
  const endpoint = "api/vision";
  const sanitizedBaseUrl = baseUrl.endsWith("/")
    ? baseUrl.slice(0, -1)
    : baseUrl;
  const url = `${sanitizedBaseUrl}/${endpoint}`;

  const response = await makeApiRequest(() =>
    fetch(url, {
      method: "POST",
      body: JSON.stringify(jsonPayload),
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
    })
  );
  const result = await response.json();

  // @ts-ignore
  return result.text;
}

async function main() {
  const settings = new FileOrganizerSettings();
  const folderToWatch = settings.pathToWatch;
  const fileOrganizer = new FileOrganizer(settings);

  await fileOrganizer.checkAndCreateFolders();

  chokidar
    .watch(folderToWatch, { ignoreInitial: true })
    .on("add", async (filePath) => {
      await fileOrganizer.processFileV2(filePath);
    })
    .on("change", async (filePath) => {
      await fileOrganizer.processFileV2(filePath);
    });

  await fileOrganizer.processBacklog();

  console.log("Watching for new files in the inbox...");
}

main();
