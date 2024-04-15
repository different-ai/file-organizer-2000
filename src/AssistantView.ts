import {
  ItemView,
  MarkdownPreviewView,
  MarkdownRenderChild,
  MarkdownView,
  TFile,
  WorkspaceLeaf,
} from "obsidian";
import FileOrganizer from ".";

export const ASSISTANT_VIEW_TYPE = "fo2k.assistant.sidebar";

export class AssistantView extends ItemView {
  private readonly plugin: FileOrganizer;
  private suggestionBox: HTMLElement;
  private loading: HTMLElement;
  private similarLinkBox: HTMLDivElement;
  similarFolderBox: HTMLDivElement;

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
    this.loading.style.display = "block";

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
          if (!tag.startsWith('#')) {
            tag = `#${tag}`;
          }
          this.app.vault.append(file, `\n ${tag}`);
          child.remove();
        });
      });
    } else {
      this.suggestionBox.setText("No suggestions");
    }
    this.loading.style.display = "none";
  };

  suggestFolders = async (file: TFile, content: string) => {
    const folder = await this.plugin.getAIClassifiedFolder(content, file);
    this.similarFolderBox.empty();
    this.similarFolderBox.appendChild(
      this.similarFolderBox.createEl("span", { text: folder })
    );
    const addFileButton = this.similarFolderBox.createEl("button", {
      text: "Move",
      cls: ["mod-cta"],
    });
    addFileButton.style.cursor = "pointer";
    addFileButton.style.margin = "8px";
    addFileButton.onclick = () => {
      this.plugin.moveContent(file, file.basename, folder);
    };
    this.similarFolderBox.appendChild(addFileButton);
  };

  handleFileOpen = async (file: TFile) => {
    const content = await this.plugin.getTextFromFile(file);
    this.suggestTags(file, content);
    this.suggestLinks(file, content);
    this.suggestFolders(file, content);
  };

  initUI() {
    this.containerEl.empty();
    this.containerEl.addClass("tag-container");

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

    this.loading = this.suggestionBox.createEl("div", {
      text: "Loading...",
    });
    this.loading.style.display = "none";
  }

  async onOpen() {
    this.initUI();

    this.registerEvent(
      this.app.workspace.on("file-open", async (file) => {
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
