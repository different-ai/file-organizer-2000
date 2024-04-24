import { ItemView, TFile, WorkspaceLeaf, setIcon } from "obsidian";
import FileOrganizer from ".";
import { logMessage } from "../utils";

export const ASSISTANT_VIEW_TYPE = "fo2k.assistant.sidebar";

export class AssistantView extends ItemView {
  private readonly plugin: FileOrganizer;
  private selectedFileBox: HTMLElement;
  private suggestionBox: HTMLElement;
  private loading: HTMLElement;
  private similarLinkBox: HTMLDivElement;
  private similarFolderBox: HTMLDivElement;
  private aliasSuggestionBox: HTMLDivElement; // Added for rename suggestion
  loadingOverlay: HTMLElement
  loadingIcon: HTMLElement; // Add the loadingIcon property

  constructor(leaf: WorkspaceLeaf, plugin: FileOrganizer) {
    super(leaf);
    this.plugin = plugin;
  }

  getDisplayText(): string {
    return "Assistant";
  }

  getViewType(): string {
    return ASSISTANT_VIEW_TYPE;
  }
  getIcon(): string {
    return "pencil";
  }
  displayTitle = async (file: TFile) => {
    const title = file.basename;
    this.selectedFileBox.empty();

    const titleElement = this.selectedFileBox.createEl("span", { text: title });
    titleElement.style.fontSize = "1rem";
    this.selectedFileBox.appendChild(titleElement);
  };

  suggestTags = async (file: TFile, content: string) => {
    const tags = await this.plugin.getSimilarTags(content, file.basename);

    if (tags.length > 0) {
      this.suggestionBox.empty();
      tags.forEach((tag) => {
        const child = this.suggestionBox.appendChild(
          this.suggestionBox.createEl("span", {
            cls: [
              "cursor-pointer",
              "cm-hashtag",
              "cm-hashtag-begin",
              "cm-meta",
              "cm-tag",
              "cm-hashtag-end",
            ],
            text: tag,
          })
        );
        child.style.cursor = "pointer";
        child.style.margin = "2px";
        // first child margin 0
        if (tags.indexOf(tag) === 0) {
          child.style.margin = "0px";
        }
        child.style.fontSize = "1rem";
        child.addEventListener("click", () => {
          if (!tag.startsWith("#")) {
            tag = `#${tag}`;
          }
          this.plugin.appendTag(file, tag);
          child.remove();
        });
      });
    } else {
      this.suggestionBox.setText("No suggestions");
      this.suggestionBox.style.color = "var(--text-accent)";
    }
    this.loading.style.display = "none";
  };
  suggestAlias = async (file: TFile, content: string) => {
    const suggestedName = await this.plugin.generateNameFromContent(content);
    this.aliasSuggestionBox.empty();

    this.aliasSuggestionBox.style.display = "flex";
    this.aliasSuggestionBox.style.alignItems = "center";
    const nameElement = this.aliasSuggestionBox.createEl("span", {
      text: suggestedName,
    });
    const renameIcon = this.aliasSuggestionBox.createEl("span", {
      cls: ["clickable-icon", "setting-editor-extra-setting-button"],
    });
    setIcon(renameIcon, "plus");
    renameIcon.style.cursor = "pointer";
    renameIcon.style.margin = "5px";
    renameIcon.onclick = async () => {
      logMessage("Adding alias " + suggestedName + " to " + file.basename);
      this.plugin.appendToFrontMatter(file, "alias", suggestedName);
    };
    // 1.2em
    nameElement.style.fontSize = "1rem";
    // make text purple
    nameElement.style.color = "var(--text-accent)";
    this.aliasSuggestionBox.appendChild(nameElement);
    this.aliasSuggestionBox.appendChild(renameIcon);
  };

  suggestFolders = async (file: TFile, content: string) => {
    const folder = await this.plugin.getAIClassifiedFolder(content, file);
    this.similarFolderBox.empty();
    this.similarFolderBox.style.display = "flex";
    this.similarFolderBox.style.alignItems = "center";
    this.similarFolderBox.appendChild(
      this.similarFolderBox.createEl("span", { text: folder })
    );
    const moveFilebutton = this.similarFolderBox.createEl("div", {
      text: "Move",
      cls: ["clickable-icon", "setting-editor-extra-setting-button"],
    });

    setIcon(moveFilebutton, "folder-input");
    moveFilebutton.style.cursor = "pointer";
    moveFilebutton.style.margin = "5px";
    moveFilebutton.onclick = () => {
      this.plugin.moveContent(file, file.basename, folder);
    };
    this.similarFolderBox.style.fontSize = "1rem";
    // make text purple
    this.similarFolderBox.style.color = "var(--text-accent)";
    this.similarFolderBox.appendChild(moveFilebutton);
  };


  handleFileOpen = async (file: TFile) => {
    // Show the loading overlay
    this.loadingOverlay.style.display = "flex";
    this.displayTitle(file);
    const content = await this.plugin.getTextFromFile(file);
    this.suggestTags(file, content);
    this.suggestFolders(file, content);
    await this.suggestAlias(file, content); // Call the suggestRename method

    this.loadingOverlay.style.display = "none";
  };

  initUI() {
    this.containerEl.empty();
    this.containerEl.addClass("assistant-container");


    // Create a loading overlay and add it to the container
    this.loadingOverlay = this.containerEl.createEl("div", { attr: { class: "loading-overlay" } });
    this.loadingOverlay.style.display = "none"; // Hide it initially

    // Create a loading spinner and add it to the overlay
    this.loadingIcon = this.loadingOverlay.createEl("div", { attr: { class: "spinner" } });

    if (!this.plugin.settings.enableEarlyAccess) {
      this.containerEl.createEl("h5", {
        text: "The AI Assistant is an early access feature currently available to supporters.",
      });

      const supportLink = this.containerEl.createEl("a", {
        href: "https://dub.sh/support-fo2k",
        text: "Support here to gain access.",
      });
      supportLink.setAttr("target", "_blank");
    }
    const createHeader = (text) => {
      const header = this.containerEl.createEl("h6", { text });
      header.style.paddingLeft = "24px";
      return header;
    };

    // add a header mentioning the selected file name
    createHeader("Looking at");
    this.selectedFileBox = this.containerEl.createEl("div");
    this.selectedFileBox.style.paddingLeft = "24px";

    createHeader("Similar tags");
    this.suggestionBox = this.containerEl.createEl("div");
    this.suggestionBox.style.paddingLeft = "24px";

    createHeader("Suggested alias");
    this.aliasSuggestionBox = this.containerEl.createEl("div");
    this.aliasSuggestionBox.style.paddingLeft = "24px";

    createHeader("Suggested folder");
    this.similarFolderBox = this.containerEl.createEl("div");
    this.similarFolderBox.style.paddingLeft = "24px";

    this.loading = this.suggestionBox.createEl("div", {
      text: "Loading...",
    });
    this.loading.style.display = "none";
  }

  async onOpen() {
    this.containerEl.empty();
    this.containerEl.addClass("assistant-container");

    // Create a loading icon and add it to the container
    this.loadingIcon = this.containerEl.createEl("div", { attr: { id: "loading-icon" } });
    this.loadingIcon.style.display = "none"; // Hide it initially

    this.initUI();

    this.registerEvent(
      this.app.workspace.on("file-open", async (file) => {



        // // Hide the AI assistant sidebar for 500ms
        // if (aiAssistantSidebar) {
        //   aiAssistantSidebar.style.display = "none";
        //   setTimeout(() => {
        //     aiAssistantSidebar.style.display = "";
        //   }, 500);
        // }

        if (!this.plugin.settings.enableEarlyAccess) {
          return;
        }
        this.loading.style.display = "block";
        if (!file) {
          this.suggestionBox.setText("No file opened");
          this.loading.style.display = "none";
          return;
        }
        this.handleFileOpen(file);
      })
    );
  }

  async onClose() {
    // Nothing to clean up.
  }
}
