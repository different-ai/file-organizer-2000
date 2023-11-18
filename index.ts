import {
	Plugin,
	Notice,
	PluginSettingTab,
	App,
	Setting,
	// getLinkpath,
	TFile,
} from "obsidian";
import useName from "./modules/name";
import useVision from "./modules/vision";
import useAudio from "./modules/audio";
import usePostProcessing from "./modules/text";
import { getAllDailyNotes, getDailyNote } from "./lib/daily-notes";
import moment from "moment";

const isSupportedImage = ["png", "jpeg", "gif", "webp", "jpg"];
const isSupportedAudio = ["mp3", "mp4", "mpeg", "mpga", "m4a", "wav", "webm"];

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
	useDailyNotesLog = false;
	destinationPath = "Ava/Processed";
	attachmentsPath = "Ava/Processed/Attachments";
	pathToWatch = "Ava/Inbox";
}

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
		console.log("Looking at", file);
		await this.checkAndCreateFolders();
		if (!(file.parent?.path === this.settings.pathToWatch)) return;
		console.log("Will process", file);
		this.checkHasAPIKey();

		if (isSupportedImage.includes(file.extension)) {
			console.log("is supported image");
			await this.handleImage(file);
			return;
		}
		// do the same for audio files
		if (isSupportedAudio.includes(file.extension)) {
			console.log("is supported audio");
			await this.handleAudio(file);
		}
	}
	async checkAndCreateFolders() {
		// Check if Inbox the folder exists
		if (!(await this.app.vault.adapter.exists(this.settings.pathToWatch))) {
			console.log('creating folder "Inbox"');
			// If the folder doesn't exist, create it
			await this.app.vault.createFolder(this.settings.pathToWatch);
		}

		if (
			!(await this.app.vault.adapter.exists(
				this.settings.destinationPath
			))
		) {
			console.log('creating folder "Processed"');
			// If the folder doesn't exist, create it
			await this.app.vault.createFolder(this.settings.destinationPath);
		}

		if (
			!(await this.app.vault.adapter.exists(
				this.settings.attachmentsPath
			))
		) {
			console.log('creating folder "Processed/Attachments"');
			// If the folder doesn't exist, create it
			await this.app.vault.createFolder(this.settings.attachmentsPath);
		}
	}

	async onload() {
		await this.loadSettings();
		this.addSettingTab(new FileOrganizerSettingTab(this.app, this));
		console.log(
			"appHasDailyNotesPluginLoaded",
			this.appHasDailyNotesPluginLoaded()
		);
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
			if (this.settings.useDailyNotesLog) {
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
			if (this.settings.useDailyNotesLog) {
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
	async appendToDailyNotes(fileName: string, action = "") {
		const dailyNotes = getAllDailyNotes();
		const lastDailyNote = getDailyNote(moment(), dailyNotes);
		// render hours:minutes
		const now = new Date();
		const formattedNow =
			now.getHours().toString().padStart(2, "0") +
			":" +
			now.getMinutes().toString().padStart(2, "0");
		// Include the link in the processed content
		const contentWithLink = `\n - ${formattedNow} ${fileName}`;
		await this.app.vault.append(lastDailyNote, contentWithLink);
	}

	async getContentFromAudio(file: TFile) {
		// @ts-ignore
		const filePath = file.vault.adapter.basePath + "/" + file.path;
		const transcribedText = await useAudio(filePath, this.settings.API_KEY);
		const postProcessedText = await usePostProcessing(
			transcribedText,
			this.settings.API_KEY
		);

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

	checkHasAPIKey() {
		if (!this.settings.API_KEY) {
			new Notice(
				"Please enter your API Key in the settings of the OCR plugin."
			);
			return false;
		}
		return true;
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
			.setName("API Key")
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
			.setName("Use Daily Notes Log")
			.setDesc("Enable or disable the use of daily notes log.")
			.setDisabled(!this.plugin.appHasDailyNotesPluginLoaded())
			.addToggle((toggle) =>
				toggle
					.setValue(this.plugin.settings.useDailyNotesLog)
					.onChange(async (value) => {
						this.plugin.settings.useDailyNotesLog = value;
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
	}
}
