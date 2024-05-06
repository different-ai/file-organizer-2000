import {
  PluginSettingTab,
  App,
  Setting,
  requestUrl,
  Notice,
  ButtonComponent,
  TFile,
} from "obsidian";
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

    new Setting(containerEl)
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
    // make button inside a setting container

    new ButtonComponent(containerEl)
      .setButtonText("Tutorial")
      .setClass("settings-tutorial-button")
      .onClick(async () => {
        // open a gitub link to the raw markdown tutorial
        window.open(
          "https://github.com/different-ai/file-organizer-2000/blob/master/tutorials/howItWorks.md",
          "_blank"
        );
      });

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
      .setName("Rename untitled files only")
      .setDesc("Only rename files that have 'Untitled' in their name ).")
      .addToggle((toggle) =>
        toggle
          .setValue(this.plugin.settings.renameUntitledOnly)
          .onChange(async (value) => {
            if (!value) {
              this.plugin.settings.renameUntitledOnly = false;
              await this.plugin.saveSettings();
              return;
            }
            if (!this.plugin.settings.renameDocumentTitle) {
              new Notice(
                "Rename document title must be enabled to rename untitled files.",
                6000
              );
              toggle.setValue(false);
              return;
            }
            this.plugin.settings.renameUntitledOnly = value;
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
    new Setting(containerEl)
      .setName("Processed File Tag")
      .setDesc("Specify the tag to be added to processed files.")
      .addToggle((toggle) =>
        toggle
          .setValue(this.plugin.settings.processedTag)
          .onChange(async (value) => {
            this.plugin.settings.processedTag = value;
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

    new ButtonComponent(containerEl)
      .setButtonText("Become an Early Supporter")
      .setClass("settings-cta-button")
      .setCta()
      .onClick(() => {
        window.open("https://app.fileorganizer2000.com/", "_blank");
      });

    new Setting(containerEl)
      .setName("Enable Early Access")
      .setDesc(
        "Enable early access to new features. You need to be a supporter to enable this."
      )
      .addToggle((toggle) =>
        toggle
          .setValue(this.plugin.settings.enableEarlyAccess)
          .onChange(async (value) => {
            if (!value) {
              this.plugin.settings.enableEarlyAccess = false;
              await this.plugin.saveSettings();
              return;
            }
            new Notice("Checking for early access...");
            const isCustomer = await this.plugin.checkForEarlyAccess();

            if (!isCustomer) {
              new Notice(
                "You need to be a supporter to enable Early Access Features.",
                6000
              );
              toggle.setValue(false);
              return;
            }

            this.plugin.settings.enableEarlyAccess = true;
            new Notice("Early Access Features enabled.");
            return;
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
      .setName("AI Assistant")
      .setDesc(
        "A sidebar that gives you more control in your file management. Open command pallette and search for 'AI Assistant' to open."
      );

    new Setting(containerEl)
      .setName("Experimental: Full Auto Org (in progress)")
      .setDesc("Let file Organizer work fully automatically.")
      .setDisabled(true);

    new Setting(containerEl)
      .setName("Transcribe Embedded Audio")
      .setDesc(
        "This features automatically add transcriptions inside your files where you record a fresh audio recording or drop a audio file."
      )
      .addToggle((toggle) =>
        toggle
          .setValue(this.plugin.settings.transcribeEmbeddedAudio)
          .onChange(async (value) => {
            // value is false than disable
            if (!value) {
              this.plugin.settings.transcribeEmbeddedAudio = false;
              await this.plugin.saveSettings();
              return;
            }
            if (!this.plugin.settings.enableEarlyAccess) {
              new Notice(
                "You need to be a supporter to enable this feature.",
                6000
              );
              toggle.setValue(false);
              return;
            }

            // value is true but early access is not enabled
            // show notice and set value to false
            if (!this.plugin.settings.enableEarlyAccess) {
              new Notice(
                "You need to be a supporter to enable this feature.",
                6000
              );
              toggle.setValue(false);
              return;
            }
            this.plugin.settings.transcribeEmbeddedAudio = true;
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl).setName("Custom Formatting").setHeading();

    new Setting(containerEl)
      .setName("Enable Document Classification")
      .setDesc("Automatically classify and format documents in the inbox.")
      .addToggle((toggle) =>
        toggle
          .setValue(this.plugin.settings.enableDocumentClassification)
          .onChange(async (value) => {
            if (!value) {
              this.plugin.settings.enableDocumentClassification = false;
              await this.plugin.saveSettings();
              return;
            }
            if (!this.plugin.settings.enableEarlyAccess) {
              new Notice(
                "You need to be a supporter to enable this feature.",
                6000
              );
              toggle.setValue(false);
              return;
            }
            this.plugin.settings.enableDocumentClassification = value;
            await this.plugin.saveSettings();
          })
      );

    // Information section about the new method of specifying document type and accessing it via the AI sidebar
    new Setting(containerEl)
      .setName("Document Type Configuration")
      .setDesc(
        "To specify the document type for AI formatting, please add a file inside the template folder of File Organizer. Each file should be named according to the document type it represents (e.g., 'workout'). The content of each file should be the prompt that will be applied to the formatting. Additionally, you can access and manage these document types directly through the AI sidebar in the application."
      )
      .setDisabled(true);
  }
}
