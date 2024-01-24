import {
	Plugin,
	Notice,
	PluginSettingTab,
	App,
	Setting,
	File,
	TFolder,
	TFile,
} from "obsidian";
import useName from "./modules/name";
import useVision from "./modules/vision";
import useAudio from "./modules/audio";
// import usePostProcessing from "./modules/text";
import moment from "moment";
import useText from "./modules/text";
import { logMessage, formatToSafeName, cleanPath } from "./utils";
class FileOrganizerSettings {
	API_KEY = "";
	useLogs = true;
	defaultDestinationPath = "Ava/Processed";
	attachmentsPath = "Ava/Processed/Attachments";
	pathToWatch = "Ava/Inbox";
	logFolderPath = "Ava/Logs";
	useSimilarTags = true; // default value is true
	useAutoCreateFolders = true; // default value is true
	customVisionPrompt = ""; // default value is an empty string
	useAutoAppend = false; // default value is true
}

const validAudioExtensions = ["mp3", "wav", "webm"];
const validImageExtensions = ["png", "jpg", "jpeg", "gif", "svg"];

export default class FileOrganizer extends Plugin {
	settings: FileOrganizerSettings;

	async processFileV2(file: TFile) {
		new Notice(`Looking at file ${file.basename}`, 3000);
		await this.checkAndCreateFolders();
		logMessage("Looking at", file);
		this.validateAPIKey();
		if (!file.extension) return;

		let content = "";
		let fileToMove = file;
		if (file.extension === "md") {
			content = await this.app.vault.read(file);
		}
		if (validImageExtensions.includes(file.extension)) {
			content = await this.generateImageAnnotation(file);
			await this.moveAttachment(file);
			fileToMove = await this.createFileFromContent(content);
			await this.appendAttachment(fileToMove, file);
		}
		if (validAudioExtensions.includes(file.extension)) {
			content = await this.generateTranscriptFromAudio(file);
			await this.moveAttachment(file);
			fileToMove = await this.createFileFromContent(content);
			await this.appendAttachment(fileToMove, file);
		}
		logMessage("Content", content);
		const humandReadableFileName = await this.generateNameFromContent(
			content
		);
		logMessage("Will move", fileToMove);

		await this.moveContent(fileToMove, content, humandReadableFileName);
		await this.appendSimilarTags(content, fileToMove);
	}
	async appendAttachment(processedFile: TFile, attachmentFile: TFile) {
		logMessage("Appending attachment", attachmentFile);
		await this.app.vault.append(
			processedFile,
			`![[${attachmentFile.path}]]`
		);
	}

	async createFileFromContent(content: string) {
		const now = new Date();
		const formattedNow = now.toISOString().replace(/[-:.TZ]/g, "");
		let name = formattedNow;
		try {
			name = await useName(content, this.settings.API_KEY);
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
		content: string,
		humanReadableFileName: string
	) {
		const destinationFolder = await this.determineDestinationFolder(
			content,
			file
		);
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

	async moveAttachment(file: TFile) {
		const destinationFolder = this.settings.attachmentsPath;
		const destinationPath = `${destinationFolder}/${file.basename}`;
		await this.app.vault.rename(file, destinationPath);
	}

	async generateNameFromContent(content: string): Promise<string> {
		new Notice(`Generating name for ${content.substring(0, 20)}...`, 3000);
		const name = await useName(content, this.settings.API_KEY);
		const safeName = formatToSafeName(name);
		new Notice(`Generated name: ${safeName}`, 3000);
		return safeName;
	}

	async generateTranscriptFromAudio(file: TFile) {
		new Notice(`Generating transcription for ${file.basename}`, 3000);
		// @ts-ignore
		const filePath = file.vault.adapter.basePath + "/" + file.path;

		const transcribedText = await useAudio(filePath, this.settings.API_KEY);
		const postProcessedText = transcribedText;
		return postProcessedText;
	}

	async generateImageAnnotation(file: TFile) {
		new Notice(`Generating annotation for ${file.basename}`, 3000);
		const arrayBuffer = await this.app.vault.readBinary(file);
		const fileContent = Buffer.from(arrayBuffer);
		const encodedImage = fileContent.toString("base64");
		logMessage(`Encoded: ${encodedImage.substring(0, 20)}...`);

		const processedContent = await useVision(
			encodedImage,
			this.settings.API_KEY,
			this.settings.customVisionPrompt // pass the custom prompt to useVision
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

	async onload() {
		await this.initializePlugin();
		// on layout ready register event handlers
		this.addCommand({
			id: "append-existing-tags",
			name: "Append Existing Tags",
			callback: async () => {
				const activeFile = this.app.workspace.getActiveFile();
				if (activeFile) {
					const fileContent = await this.app.vault.read(activeFile);
					await this.appendSimilarTags(fileContent, activeFile);
				}
			},
		});
		this.addCommand({
			id: "organize-file",
			name: "Oranize Current File",
			callback: async () => {
				const activeFile = this.app.workspace.getActiveFile();
				if (activeFile) {
					await this.processFileV2(activeFile);
				}
			},
		});
		this.app.workspace.onLayoutReady(this.registerEventHandlers.bind(this));
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
		this.addSettingTab(new FileOrganizerSettingTab(this.app, this));
	}

	registerEventHandlers() {
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
	async getSimilarTags(content: string, fileName: string): Promise<string[]> {
		// 1. Get all tags from the vault
		// @ts-ignore
		const tags = this.app.metadataCache.getTags();

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
			this.settings.API_KEY
		);
		// Extract the most similar tags from the response

		return mostSimilarTags.split(",").map((tag) => tag.trim());
	}
	getAllFolders(): string[] {
		const allFiles = this.app.vault.getAllLoadedFiles();
		const folderPaths = allFiles
			.filter((file) => file instanceof TFolder)
			// @ts-ignore
			.map((folder: TFolder) => folder.path);
		const uniqueFolders = [...new Set(folderPaths)];
		logMessage("uniqueFolders", uniqueFolders);
		return uniqueFolders;
	}

	async shouldAppendToExistingFile(content: string): Promise<boolean> {
		if (!this.settings.useAutoAppend) {
			return false;
		}
		const shouldAppend = await useText(
			`content: ${content}
question: is there a request by the user to append this to a document? only answer with 'yes' or 'no'`,
			"You pattern match requests to append text to document. The request is included within the text. Please respond with 'Yes' or 'No'.",
			this.settings.API_KEY
		);
		return shouldAppend.includes("Yes");
	}

	async guessNewFolderName(
		content: string,
		fileName: string
	): Promise<string> {
		const uniqueFolders = this.getAllFolders();
		// based on the content, the file name, and existiing folders, guess a new folder name
		const newFolderName = await useText(
			// prompt
			`Based on the current folder structure of the user: ${uniqueFolders.join()}, guess a new folder name for the file "${fileName}" and its content "${content}"`,
			// system prompt
			"Please respond with a name for the new folder. You never guess an existing folder. Valid answers are like 'New Folder/Path 1' or 'New Folder/Path 2'.",
			this.settings.API_KEY
		);
		return newFolderName;
	}
	async determineDestinationFolder(
		content: string,
		file: TFile
	): Promise<string> {
		// Initialize destination folder as "None"
		let destinationFolder = "None";

		// Get all folders
		const uniqueFolders = this.getAllFolders();

		// Remove current file folder from list of uniqueFolders
		const currentFolderIndex = uniqueFolders.indexOf(file.parent.path);
		if (currentFolderIndex > -1) {
			uniqueFolders.splice(currentFolderIndex, 1);
		}
		logMessage("uniqueFolders", uniqueFolders);

		// Get the most similar folder based on the content and file name
		const mostSimilarFolder = await useText(
			`Given the text content "${content}" (and if the file name "${
				file.basename
			}"), which of the following folders would be the most appropriate location for the file? Available folders: ${uniqueFolders.join(
				", "
			)}`,
			"Please respond with the name of the most appropriate folder from the provided list. If none of the folders are suitable, respond with 'None'.",
			this.settings.API_KEY
		);
		logMessage("mostSimilarFolder", mostSimilarFolder);
		new Notice(`Most similar folder: ${mostSimilarFolder}`, 3000);

		// Extract the most similar folder from the response
		const sanitizedFolderName = mostSimilarFolder.replace(
			/[\\:*?"<>|]/g,
			""
		);

		// If auto-create folders is enabled and no similar folder is found
		if (
			this.settings.useAutoCreateFolders &&
			sanitizedFolderName === "None"
		) {
			// Notify user about creating a new folder
			new Notice(`Creating new folder`, 3000);

			// Guess a new folder name based on the content and file name
			destinationFolder = await this.guessNewFolderName(
				content,
				file.basename
			);

			// Notify user about the created new folder
			new Notice(`Created new folder ${destinationFolder}`, 3000);

			// Ensure the new folder exists
			this.ensureFolderExists(destinationFolder);
		}

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

	async appendSimilarTags(content: string, file: TFile) {
		if (!this.settings.useSimilarTags) {
			return;
		}
		// Get similar tags
		const similarTags = await this.getSimilarTags(content, file.basename);

		// Append similar tags
		if (similarTags.length > 0) {
			this.appendToCustomLogFile(
				`Added similar tags to [[${file.basename}]]`
			);
			await this.app.vault.append(file, `\n${similarTags.join(" ")}`);
			new Notice(`Added similar tags to ${file.basename}`, 3000);
			return;
		}
		new Notice(`No similar tags found`, 3000);
	}

	async getMostSimilarFile(content: string): Promise<TFile> {
		const allMarkdownFiles = this.app.vault.getMarkdownFiles();
		const allMarkdownFilePaths = allMarkdownFiles.map((file) => file.path);

		// Get the most similar file based on the content
		const mostSimilarFile = await useText(
			`Given the request of the user to append it in a certain file in "${content}", which of the following files would match the user request the most? Available files: ${allMarkdownFilePaths.join(
				","
			)}`,
			"Please only respond with the full path of the most appropriate file from the provided list.",
			this.settings.API_KEY
		);

		// Extract the most similar file from the response
		const sanitizedFileName = mostSimilarFile.replace(/[\\:*?"<>|]/g, "");

		const file = this.app.vault.getAbstractFileByPath(sanitizedFileName);
		if (!file) {
			throw new Error(
				`Could not find file with path ${sanitizedFileName}`
			);
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
			throw new Error(
				`File with path ${logFilePath} is not a markdown file`
			);
		}

		const formattedTime =
			now.getHours().toString().padStart(2, "0") +
			":" +
			now.getMinutes().toString().padStart(2, "0");
		const contentWithLink = `\n - ${formattedTime} ${contentToAppend}`;
		await this.app.vault.append(logFile, contentWithLink);
	}

	validateAPIKey() {
		if (!this.settings.API_KEY) {
			throw new Error(
				"Please enter your API Key in the settings of the OCR plugin."
			);
		}
	}
}
class FileOrganizerSettingTab extends PluginSettingTab {
	plugin: FileOrganizer;

	constructor(app: App, plugin: FileOrganizer) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;

		containerEl.empty();

		new Setting(containerEl)
			.setName("OpenAI API Key")
			.setDesc("Enter your API Key here")
			.addText((text) =>
				text
					.setPlaceholder("Enter your API Key")
					.setValue(this.plugin.settings.API_KEY)
					.onChange(async (value) => {
						this.plugin.settings.API_KEY = value;
						await this.plugin.saveSettings();
					})
			);

		new Setting(containerEl)
			.setName("Inbox Folder")
			.setDesc("Choose which folder to automatically organize files from")
			.addText((text) =>
				text
					.setPlaceholder("Enter your path")
					.setValue(this.plugin.settings.pathToWatch)
					.onChange(async (value) => {
						this.plugin.settings.pathToWatch = cleanPath(value);
						await this.plugin.saveSettings();
					})
			);

		containerEl.createEl("h2", { text: "Features" });

		new Setting(containerEl)
			.setName("Organization Logs")
			.setDesc(
				"Allows you to keep track of the changes made by file Organizer."
			)
			.addToggle((toggle) =>
				toggle
					.setValue(this.plugin.settings.useLogs)
					.onChange(async (value) => {
						this.plugin.settings.useLogs = value;
						await this.plugin.saveSettings();
					})
			);

		new Setting(containerEl)
			.setName("Similar Tags")
			.setDesc("Append similar tags to the processed file.")
			.addToggle((toggle) =>
				toggle
					.setValue(this.plugin.settings.useSimilarTags)
					.onChange(async (value) => {
						this.plugin.settings.useSimilarTags = value;
						await this.plugin.saveSettings();
					})
			);
		new Setting(containerEl)
			.setName("Folder Guessing")
			.setDesc(
				"If no similar folder is found, let File Organizer guess a new folder and create it."
			)
			.addToggle((toggle) =>
				toggle
					.setValue(this.plugin.settings.useAutoCreateFolders)
					.onChange(async (value) => {
						this.plugin.settings.useAutoCreateFolders = value;
						await this.plugin.saveSettings();
					})
			);

		containerEl.createEl("h2", { text: "Folder Configuration" });

		new Setting(containerEl)
			.setName("Attachments Folder")
			.setDesc(
				"Enter the path to the folder where the original images and audio will be moved."
			)
			.addText((text) =>
				text
					.setPlaceholder("Enter your path")
					.setValue(this.plugin.settings.attachmentsPath)
					.onChange(async (value) => {
						// cleanup path remove leading and trailing slashes
						this.plugin.settings.attachmentsPath = cleanPath(value);
						await this.plugin.saveSettings();
					})
			);
		new Setting(containerEl)
			.setName("File Organizer Log Folder")
			.setDesc("Choose a folder for Organization Logs e.g. Ava/Logs.")
			.addText((text) =>
				text
					.setPlaceholder("Enter your path")
					.setValue(this.plugin.settings.logFolderPath)
					.onChange(async (value) => {
						this.plugin.settings.logFolderPath = cleanPath(value);
						await this.plugin.saveSettings();
					})
			);
		new Setting(containerEl)
			.setName("Output Folder Path")
			.setDesc(
				"Enter the path where you want to save the processed files. e.g. Processed/myfavoritefolder"
			)
			.addText((text) =>
				text
					.setPlaceholder("Enter your path")
					.setValue(this.plugin.settings.defaultDestinationPath)
					.onChange(async (value) => {
						const cleanedPath = cleanPath(value);
						logMessage(cleanedPath);
						this.plugin.settings.defaultDestinationPath =
							cleanedPath;
						await this.plugin.saveSettings();
					})
			);

		containerEl.createEl("h2", { text: "Experimental Features" });

		new Setting(containerEl)
			.setName("Custom Vision Prompt")
			.setDesc("Enter your custom prompt for vision processing here")
			.addText((text) =>
				text
					.setPlaceholder("Enter your custom prompt")
					.setValue(this.plugin.settings.customVisionPrompt)
					.onChange(async (value) => {
						this.plugin.settings.customVisionPrompt = value;
						await this.plugin.saveSettings();
					})
			);

		new Setting(containerEl)
			.setName("Experimental: Describe workfow (contact for access)")
			.setDesc(
				"Use words to explain how File Organizer uses GPT-4 to organize your files."
			)
			.setDisabled(true);
		new Setting(containerEl)
			.setName(
				"Experimental: Append to Existing file (contact for access)"
			)
			.setDesc(
				"Let file Organizer find the most similar file and append the content to it."
			)
			.setDisabled(true);
		new Setting(containerEl)
			.setName("Experimental: Full Auto Org (contact for access	)")
			.setDesc("Let file Organizer work fully automatically.")
			.setDisabled(true);
	}
}
