import { Plugin, Notice, PluginSettingTab, App, Setting } from "obsidian";
import useName from "./name";
import useVision from "./vision";

const supportedFormats = ["png", "jpeg", "gif", "webp", "jpg"];

class FileOrganizerSettings {
	API_KEY = "";
}

export default class FileOrganizer extends Plugin {
	settings: FileOrganizerSettings;

	async onload() {
		await this.loadSettings();
		this.addSettingTab(new FileOrganizerSettingTab(this.app, this));

		this.app.workspace.onLayoutReady(() => {
			this.registerEvent(
				this.app.vault.on("create", async (file) => {
					console.log("File created:", file);
					// @ts-ignore
					console.log(file.extension);
					// @ts-ignore
					if (supportedFormats.includes(file.extension)) {
						await this.processFile(file);
					}
				})
			);
		});
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

	async processFile(file) {
		this.checkHasAPIKey();
		try {
			new Notice("Processing file...");
			await this.createMardownFromImage(file);
			new Notice("File processed and saved.");
		} catch (error) {
			console.error("Error processing file:", error);
			new Notice("Failed to process file.");
		}
	}
	async createMardownFromImage(imageFile) {
		const arrayBuffer = await this.app.vault.readBinary(imageFile);
		const fileContent = Buffer.from(arrayBuffer);
		const encodedImage = fileContent.toString("base64");

		console.log("Encoded image:", encodedImage);
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
			console.error("Error processing file:", error);
			new Notice("Could not set a human readable name.");
		}
		const safeName = name.replace(/[\\/:]/g, "");
		const folderPath = "/Processed";
		const outputFilePath = `${folderPath}/${safeName}.md`;

		// Check if the folder exists
		if (!this.app.vault.adapter.exists(folderPath)) {
			// If the folder doesn't exist, create it
			await this.app.vault.createFolder(folderPath);
		}

		// Get the path of the original image
		// const originalImagePath = imageFile.path;
		const originalImagePath = this.app.vault.getResourcePath(imageFile);

		// Create a link to the original image
		const imageLink = `![${safeName}](${originalImagePath})`;

		// Include the link in the processed content
		const contentWithLink = `${imageLink}\n\n${processedContent}`;

		await this.app.vault.create(outputFilePath, contentWithLink);
	}

	checkHasAPIKey() {
		console.log(this);
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
	}
}
