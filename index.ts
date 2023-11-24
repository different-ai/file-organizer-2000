import {
	Plugin,
	Notice,
	PluginSettingTab,
	App,
	Setting,
	// getLinkpath,
	TFile,
	normalizePath,
	TFolder,
} from "obsidian";
import useName from "./modules/name";
import useVision from "./modules/vision";
import useAudio from "./modules/audio";
// import usePostProcessing from "./modules/text";
import moment from "moment";
import useText from "./modules/text";

function formatToSafeName(format: string) {
	return format.replace(/[\\/:"]/g, "");
}
function cleanPath(path: string) {
	const trimmedPath = path.trim();
	// cleanup path remove leading and trailing slashes
	const pathWithoutLeadingAndTrailingSlashes = trimmedPath.replace(
		/^\/+|\/+$/g,
		""
	);
	return pathWithoutLeadingAndTrailingSlashes;
}

class FileOrganizerSettings {
	API_KEY = "";
	useLogs = true;
	destinationPath = "Ava/Processed";
	attachmentsPath = "Ava/Processed/Attachments";
	pathToWatch = "Ava/Inbox";
	logFolderPath = "Ava/Logs";
	useSimilarTags = true; // default value is true
}

type FileHandler = (file: TFile) => Promise<void>;

export default class FileOrganizer extends Plugin {
	settings: FileOrganizerSettings;

	appHasDailyNotesPluginLoaded(): boolean {
		const app = this.app;
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const dailyNotesPlugin = (<any>app).internalPlugins.plugins[
			"daily-notes"
		];
		if (dailyNotesPlugin && dailyNotesPlugin.enabled) {
			return true;
		}
		return false;
	}
	async processFile(file: TFile) {
		await this.checkAndCreateFolders();
		const fileHandlers: Record<string, FileHandler> = {
			md: this.handleMarkdown,
			png: this.handleImage,
			jpeg: this.handleImage,
			gif: this.handleImage,
			webp: this.handleImage,
			jpg: this.handleImage,
			mp3: this.handleAudio,
			mp4: this.handleAudio,
			mpeg: this.handleAudio,
			mpga: this.handleAudio,
			m4a: this.handleAudio,
			wav: this.handleAudio,
			webm: this.handleAudio,
		};
		console.log("Looking at", file);
		if (!(file.parent?.path === this.settings.pathToWatch)) return;
		console.log("Will process", file);
		this.validateAPIKey();
		const handler = fileHandlers[file.extension];
		if (handler) {
			await handler.call(this, file);
		}
	}
	async ensureFolderExists(folderPath: string) {
		if (!(await this.app.vault.adapter.exists(folderPath))) {
			await this.app.vault.createFolder(folderPath);
		}
	}
	async checkAndCreateFolders() {
		this.ensureFolderExists(this.settings.pathToWatch);
		this.ensureFolderExists(this.settings.destinationPath);
		this.ensureFolderExists(this.settings.attachmentsPath);
		this.ensureFolderExists(this.settings.logFolderPath);
	}

	async onload() {
		await this.initializePlugin();
		// on layout ready register event handlers
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
		console.log(
			"appHasDailyNotesPluginLoaded",
			this.appHasDailyNotesPluginLoaded()
		);
	}

	registerEventHandlers() {
		this.registerEvent(
			this.app.vault.on("create", (file) =>
				this.processFile(file as TFile)
			)
		);
		this.registerEvent(
			this.app.vault.on("rename", (file) =>
				this.processFile(file as TFile)
			)
		);
	}
	async getSimilarTags(content: string, fileName: string): Promise<string[]> {
		// 1. Get all tags from the vault
		const tags = this.app.metadataCache.getTags();
		console.log("tags", tags);

		console.log("tags", tags);
		// 2. Pass all the tags to GPT-3 and get the most similar tags
		const tagNames = Object.keys(tags);
		const uniqueTags = [...new Set(tagNames)];
		console.log("uniqueTags", uniqueTags);

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
	async getSimilarFolder(content: string, fileName: string): Promise<string> {
		// 1. Get all folders from the vault
		const folders = this.app.vault.getMarkdownFiles();

		// 2. Pass all the folder names to GPT-3 and get the most similar folder
		const folderNames = folders.map((folder) => folder.parent?.path);
		const uniqueFolders = [...new Set(folderNames)];
		console.log("uniqueFolders", uniqueFolders);

		// Prepare the prompt for GPT-4
		const prompt = `Given the text "${content}" (and if relevant ${fileName}), which of the following folders is the most relevant? ${uniqueFolders.join(
			", "
		)}`;
		const mostSimilarFolder = await useText(
			prompt,
			'Always answer with a single folder name from the provided list. If none of the folders are relevant, answer "Ava/Processed". A nested path is a path that includes the names of all parent folders, separated by slashes (e.g., "parentFolder/childFolder").',
			this.settings.API_KEY
		);
		// Extract the most similar folder from the response

		return mostSimilarFolder;
	}
	async handleMarkdown(file: TFile) {
		try {
			new Notice(`Processing Markdown: ${file.name}`);
			const [humanReadableFileName, content] =
				await this.getContentFromMarkdown(file);

			// Get similar tags
			let similarTags: string[] = [];

			if (this.settings.useSimilarTags) {
				similarTags = await this.getSimilarTags(content, file.basename);
			}
			// if there are similar tags, prepend them to the content
			const contentWithTags = `${
				similarTags.length === 0 ? "" : similarTags.join(" ")
			}\n\n${content}`;
			// prepend tags
			await this.app.vault.modify(file, contentWithTags);

			new Notice(`Moving file ${file.basename}`, 3000);
			// get destination folder
			await this.app.vault.rename(
				file,
				`${this.settings.destinationPath}/${humanReadableFileName}.${file.extension}`
			);

			const destinationFolder = await this.getSimilarFolder(
				content,
				file.basename
			);
			await this.app.vault.rename(
				file,
				`${destinationFolder}/${humanReadableFileName}.${file.extension}`
			);
			new Notice(
				`Moved ${humanReadableFileName} to "${destinationFolder}"`,
				3000
			);
			if (this.settings.useLogs) {
				console.log("Daily Notes Plugin is loaded");
				await this.appendToDailyNotes(
					`Organized [[${humanReadableFileName}]] into ${destinationFolder}`
				);
			}
		} catch (error) {
			console.error("Error processing file:", error);
			new Notice(`Failed to process file`, 5000);
			new Notice(`${error.message}`, 5000);
		}
	}

	async getContentFromMarkdown(file: TFile) {
		const fileContent = await this.app.vault.read(file);

		const name = await useName(fileContent, this.settings.API_KEY);
		const safeName = formatToSafeName(name);

		return [safeName, fileContent];
	}

	async handleAudio(file: TFile) {
		try {
			new Notice(`Processing Audio: ${file.name}`);
			const [humanReadableFileName, content] =
				await this.getContentFromAudio(file);

			const outputFilePath = `/${this.settings.destinationPath}/${humanReadableFileName}.md`;

			const audioLink = `![[${this.settings.attachmentsPath}/${humanReadableFileName}.${file.extension}]]`;

			// Include the link in the processed content
			const contentWithLink = `${content}\n\n${audioLink}`;
			await this.app.vault.create(outputFilePath, contentWithLink);

			new Notice(`Moving file`);
			await this.app.vault.rename(
				file,
				`${this.settings.attachmentsPath}/${humanReadableFileName}.${file.extension}`
			);
			new Notice(
				`File processed and saved as ${humanReadableFileName}`,
				5000
			);
			if (this.settings.useLogs) {
				console.log("Daily Notes Plugin is loaded");
				await this.appendToDailyNotes(
					`Transcribed [[${humanReadableFileName}]]`
				);
			}
		} catch (error) {
			console.error("Error processing file:", error);
			new Notice(`Failed to process file`, 5000);
			new Notice(`${error.message}`, 5000);
		}
	}

	async handleImage(file: TFile) {
		try {
			new Notice(`Processing Image: ${file.name}`);
			const [humanReadableFileName, content] =
				await this.createMardownFromImage(file);

			const outputFilePath = `/${this.settings.destinationPath}/${humanReadableFileName}.md`;

			const imageLink = `![[${this.settings.attachmentsPath}/${humanReadableFileName}.${file.extension}]]`;

			// Include the link in the processed content
			const contentWithLink = `${content}\n\n${imageLink}`;
			await this.app.vault.create(outputFilePath, contentWithLink);

			new Notice(`Moving file`);
			await this.app.vault.rename(
				file,
				`${this.settings.attachmentsPath}/${humanReadableFileName}.${file.extension}`
			);
			new Notice(
				`File processed and saved as ${humanReadableFileName}`,
				5000
			);
			if (this.settings.useLogs) {
				console.log("Daily Notes Plugin is loaded");
				await this.appendToDailyNotes(
					`Created annotation for [[${humanReadableFileName}]]`
				);
			}
		} catch (error) {
			console.error("Error processing file:", error);
			new Notice(`Failed to process file`, 5000);
			new Notice(`${error.message}`, 5000);
		}
	}
	async appendToCustomLogFile(contentToAppend: string, action = "") {
		const now = new Date();
		const formattedDate = moment(now).format("YYYY-MM-DD");
		const logFilePath = `${this.settings.logFolderPath}/${formattedDate}.md`;

		let logFile = this.app.vault.getAbstractFileByPath(
			logFilePath
		) as TFile;
		if (!logFile) {
			logFile = await this.app.vault.create(logFilePath, "");
		}

		const formattedTime =
			now.getHours().toString().padStart(2, "0") +
			":" +
			now.getMinutes().toString().padStart(2, "0");
		const contentWithLink = `\n - ${formattedTime} ${contentToAppend}`;
		await this.app.vault.append(logFile, contentWithLink);
	}
	// very experimental feature, will probably be removed
	async appendToDailyNotes(contentToAppend: string, action = "") {
		return await this.appendToCustomLogFile(contentToAppend, action);
	}

	async getContentFromAudio(file: TFile) {
		// @ts-ignore
		const filePath = file.vault.adapter.basePath + "/" + file.path;
		// get absolute file path
		// const filePath = getLinkpath(file, this.app.vault);

		const transcribedText = await useAudio(filePath, this.settings.API_KEY);
		const postProcessedText = transcribedText;

		const now = new Date();
		const formattedNow = now.toISOString().replace(/[-:.TZ]/g, "");
		let name = formattedNow;
		try {
			name = await useName(postProcessedText, this.settings.API_KEY);
		} catch (error) {
			console.error("Error processing file:", error.status);
			new Notice("Could not set a human readable name.");
		}
		const safeName = formatToSafeName(name);

		// Get the path of the original audio
		return [safeName, postProcessedText];
	}
	async createMardownFromImage(file) {
		const arrayBuffer = await this.app.vault.readBinary(file);
		const fileContent = Buffer.from(arrayBuffer);
		const encodedImage = fileContent.toString("base64");
		console.log(`Encoded: ${encodedImage.substring(0, 20)}...`);

		const processedContent = await useVision(
			encodedImage,
			this.settings.API_KEY
		);

		const now = new Date();
		const formattedNow = now.toISOString().replace(/[-:.TZ]/g, "");
		let name = formattedNow;
		try {
			name = await useName(processedContent, this.settings.API_KEY);
		} catch (error) {
			console.error("Error processing file:", error.status);
			new Notice("Could not set a human readable name.");
		}
		const safeName = formatToSafeName(name);

		return [safeName, processedContent];
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
			.setName("Output Folder Path")
			.setDesc(
				"Enter the path where you want to save the processed files. e.g. Processed/myfavoritefolder"
			)
			.addText((text) =>
				text
					.setPlaceholder("Enter your path")
					.setValue(this.plugin.settings.destinationPath)
					.onChange(async (value) => {
						this.plugin.settings.destinationPath = cleanPath(value);
						await this.plugin.saveSettings();
					})
			);

		new Setting(containerEl)
			.setName("Inbox Folder")
			.setDesc("Enter the path to the folder you want to auto-organize")
			.addText((text) =>
				text
					.setPlaceholder("Enter your path")
					.setValue(this.plugin.settings.pathToWatch)
					.onChange(async (value) => {
						this.plugin.settings.pathToWatch = cleanPath(value);
						await this.plugin.saveSettings();
					})
			);

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
			.setName("Use Daily Notes Log")
			.setDesc("Enable or disable the use of daily notes log.")
			.setDisabled(!this.plugin.appHasDailyNotesPluginLoaded())
			.addToggle((toggle) =>
				toggle
					.setValue(this.plugin.settings.useLogs)
					.onChange(async (value) => {
						this.plugin.settings.useLogs = value;
						await this.plugin.saveSettings();
					})
			);
		new Setting(containerEl)
			.setName("Log Folder Path")
			.setDesc(
				"Enter the path where you want to save the log files. e.g. Ava/Logs"
			)
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
			.setName("Use Similar Tags")
			.setDesc("Enable or disable the use of similar tags.")
			.addToggle((toggle) =>
				toggle
					.setValue(this.plugin.settings.useSimilarTags)
					.onChange(async (value) => {
						this.plugin.settings.useSimilarTags = value;
						await this.plugin.saveSettings();
					})
			);
	}
}
