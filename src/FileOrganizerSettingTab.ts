import { PluginSettingTab, App, Setting, requestUrl, Notice } from "obsidian";
import { logMessage, cleanPath } from "../utils";
import FileOrganizer from "./index";

export class FileOrganizerSettingTab extends PluginSettingTab {
  plugin: FileOrganizer;

  constructor(app: App, plugin: FileOrganizer) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    const { containerEl } = this;

    containerEl.empty();

    const apiKeySetting = new Setting(containerEl)
      .setName("File Organizer API Key")
      .setDesc(
        "Enter your API Key here. Get it at https://app.fileorganizer2000.com/ "
      )
      .addText((text) =>
        text
          .setPlaceholder("Enter your API Key")
          .setValue(this.plugin.settings.API_KEY)
          .onChange(async (value) => {
            if (value) loginButton.settingEl.hide();
            if (!value) loginButton.settingEl.show();
            this.plugin.settings.API_KEY = value;
            await this.plugin.saveSettings();
          })
      );

    const loginButton = new Setting(containerEl)
      .setName("Login")
      .setDesc("Click to login to File Organizer 2000")
      .addButton((button) =>
        button.setButtonText("Login").onClick(() => {
          window.open("https://app.fileorganizer2000.com/", "_blank");
        })
      );
    loginButton.settingEl.hide();

    new Setting(containerEl)
      .setName("Inbox folder")
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

    new Setting(containerEl).setName("Features").setHeading();

    new Setting(containerEl)
      .setName("FileOrganizer logs")
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
      .setName("Similar tags")
      .setDesc("Append similar tags to processed files.")
      .addToggle((toggle) =>
        toggle
          .setValue(this.plugin.settings.useSimilarTags)
          .onChange(async (value) => {
            this.plugin.settings.useSimilarTags = value;
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName("Add similar tags in frontmatter")
      .setDesc("Use frontmatter to add similar tags to processed files.")
      .addToggle((toggle) =>
        toggle
          .setValue(this.plugin.settings.useSimilarTagsInFrontmatter)
          .onChange(async (value) => {
            this.plugin.settings.useSimilarTagsInFrontmatter = value;
            await this.plugin.saveSettings();
          })
      );

    //toggle setting for enabling/disabling document title renaming
    new Setting(containerEl)
      .setName("Rename document title")
      .setDesc("Rename the document title based on the content.")
      .addToggle((toggle) =>
        toggle
          .setValue(this.plugin.settings.renameDocumentTitle)
          .onChange(async (value) => {
            this.plugin.settings.renameDocumentTitle = value;
            await this.plugin.saveSettings();
          })
      );
    // new setting for enabling/disabling aliases
    new Setting(containerEl)
      .setName("Aliases")
      .setDesc("Append aliases to processed files.")
      .addToggle((toggle) =>
        toggle
          .setValue(this.plugin.settings.useAliases)
          .onChange(async (value) => {
            this.plugin.settings.useAliases = value;
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl).setName("Folder config").setHeading();
    new Setting(containerEl)
      .setName("Attachments folder")
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
      .setName("File Organizer log folder")
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
      .setName("Output folder path")
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
            this.plugin.settings.defaultDestinationPath = cleanedPath;
            await this.plugin.saveSettings();

          })
      );

    new Setting(containerEl).setName("Experimental features").setHeading();

    new Setting(containerEl)
      .setName("Early access features")
      .setDesc(
        "Activate early access features. Go to https://dub.sh/2000 to support."
      )
      .addText((text) =>
        text
          .setPlaceholder("Enter access code for Early Access Features")
          .setValue(this.plugin.settings.earlyAccessCode)
          .onChange(async (value) => {
            if (value.length === 8) {
              console.log("runs early access code activation");
              const jsonPayload = {
                code: value,
              };
              const url = `${this.plugin.settings.defaultServerUrl}/api/secret`;
              try {
                const response = await requestUrl({
                  url: url,
                  method: "POST",
                  body: JSON.stringify(jsonPayload),
                  headers: {
                    Authorization: `Bearer ${this.plugin.settings.API_KEY}`,
                    "Content-Type": "application/json",
                  },
                });
                logMessage(response);

                if (response.status === 200) {
                  this.plugin.settings.earlyAccessCode = value;
                  this.plugin.settings.enableEarlyAccess = true; // Assuming this setting enables all early access features
                  await this.plugin.saveSettings();
                  new Notice("Early Access Features Activated Successfully");
                } else {
                  new Notice("Failed to activate Early Access Features.");
                }
              } catch (error) {
                console.error("Error activating Early Access Features:", error);
                new Notice("Error during activation process.");
              }
            }
          })
      );

    new Setting(containerEl)
      .setName("Use Self-hosted")
      .setDesc("Toggle to use a custom server instead of the default.")
      .addToggle((toggle) =>
        toggle
          .setValue(this.plugin.settings.useCustomServer)
          .onChange(async (value) => {
            this.plugin.settings.useCustomServer = value;
            await this.plugin.saveSettings();
            if (!value) {
              customServerSetting.settingEl.hide();
              return;
            }
            customServerSetting.settingEl.show();
          })
      );

    const customServerSetting = new Setting(containerEl)
      .setName("Self-hosted URL")
      .setDesc("Enter the address of your custom server.")
      .addText((text) =>
        text
          .setPlaceholder("http://localhost:3000")
          .setValue(this.plugin.settings.customServerUrl)
          .onChange(async (value) => {
            this.plugin.settings.customServerUrl = value;
            await this.plugin.saveSettings();
          })
      );

    customServerSetting.settingEl.hide();

    if (this.plugin.settings.useCustomServer) {
      customServerSetting.settingEl.show();
    }

    if (!this.plugin.settings.API_KEY) {
      loginButton.settingEl.show();
    }

    new Setting(containerEl)
      .setName("Custom vision prompt")
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
      .setName("AI Assistant (available in early access)")
      .setDesc("A sidebar that gives you more control in your file management.")
      .addToggle((toggle) => toggle.setDisabled(true));

    new Setting(containerEl)
      .setName("Experimental: Describe workflow (in progress)")
      .setDesc(
        "Use words to explain how File Organizer uses GPT-4 to organize your files."
      )
      .setDisabled(true);
    new Setting(containerEl)
      .setName("Experimental: Full Auto Org (in progress)")
      .setDesc("Let file Organizer work fully automatically.")
      .setDisabled(true);
  }
}
