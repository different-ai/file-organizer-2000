import { ItemView, TFile, WorkspaceLeaf, setIcon } from "obsidian";
import FileOrganizer from ".";
import { logMessage } from "../utils";

export const ASSISTANT_VIEW_TYPE = "fo2k.assistant.sidebar";

export class AssistantView extends ItemView {
  private readonly plugin: FileOrganizer;
  private suggestionBox: HTMLElement;
  private loading: HTMLElement;
  private similarLinkBox: HTMLDivElement;
  private similarFolderBox: HTMLDivElement;
  private aliasSuggestionBox: HTMLDivElement; // Added for rename suggestion

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
  suggestLinks = async (file: TFile, content: string) => {
    const links = await this.plugin.getMostSimilarFileByName(content, file);
    this.similarLinkBox.empty();

    const child = this.similarLinkBox.createEl("a", { text: links.basename });
    child.onclick = () => {
      this.app.workspace.openLinkText(links.path, "", true);
    };
    this.similarLinkBox.appendChild(child);
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

    renameIcon.onclick = async () => {
      logMessage("Adding alias " + suggestedName + " to " + file.basename);
      this.plugin.appendToFrontMatter(file, "alias", suggestedName);
    };
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
    moveFilebutton.style.margin = "8px";
    moveFilebutton.onclick = () => {
      this.plugin.moveContent(file, file.basename, folder);
    };
    this.similarFolderBox.appendChild(moveFilebutton);
  };

  handleFileOpen = async (file: TFile) => {
    const content = await this.plugin.getTextFromFile(file);
    this.suggestTags(file, content);
    this.suggestLinks(file, content);
    this.suggestFolders(file, content);
    this.suggestAlias(file, content); // Call the suggestRename method
  };

  initUI() {
    this.containerEl.empty();
    this.containerEl.addClass("tag-container");
    if (!this.plugin.settings.enableEarlyAccess) {
      this.containerEl.createEl("h3", {
        text: "The AI Assistant is an early access feature currently available to supporters.",
      });
      const supportLink = this.containerEl.createEl("a", {
        href: "https://dub.sh/support-fo2k",
        text: "Support here to gain access.",
      });
      supportLink.setAttr("target", "_blank");
    }
    this.containerEl.createEl("h4", {
      text: "Similar tags",
      cls: ["tree-item-self"],
    });

    this.suggestionBox = this.containerEl.createEl("div");
    this.suggestionBox.style.paddingLeft = "24px";
    this.containerEl.createEl("h4", {
      text: "Most similar link",
      cls: ["tree-item-self"],
    });
    this.similarLinkBox = this.containerEl.createEl("div");
    this.similarLinkBox.style.paddingLeft = "24px";

    this.containerEl.createEl("h4", {
      text: "Most similar folder",
      cls: ["tree-item-self"],
    });
    this.similarFolderBox = this.containerEl.createEl("div");
    this.similarFolderBox.style.paddingLeft = "24px";

    this.containerEl.createEl("h4", {
      text: "Suggested Alias",
      cls: ["tree-item-self"],
    });
    this.aliasSuggestionBox = this.containerEl.createEl("div");
    this.aliasSuggestionBox.style.paddingLeft = "24px";

    this.loading = this.suggestionBox.createEl("div", {
      text: "Loading...",
    });
    this.loading.style.display = "none";
  }

  async onOpen() {
    this.containerEl.empty();
    this.containerEl.addClass("tag-container");
    this.initUI();

    this.registerEvent(
      this.app.workspace.on("file-open", async (file) => {
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
