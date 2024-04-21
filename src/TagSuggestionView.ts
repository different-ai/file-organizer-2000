import { ItemView, TFile, WorkspaceLeaf } from "obsidian";
import FileOrganizer from ".";

export class TagSuggestionView extends ItemView {
  private readonly plugin: FileOrganizer;
  private suggestionBox: HTMLElement;
  private loading: HTMLElement;

  constructor(leaf: WorkspaceLeaf, plugin: FileOrganizer) {
    super(leaf);
    this.plugin = plugin;
  }

  getViewType(): string {
    return "fo2k.tag-suggestion-view";
  }
  getDisplayText(): string {
    return "Tag Suggestion";
  }

  suggestTags = async (file: TFile, content: string) => {
    const tags = await this.plugin.getSimilarTags(content, file.basename);
    this.suggestionBox.empty();
    this.loading.style.display = "block";
    try {
      if (tags.length > 0) {
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
    } catch (e) {
      this.suggestionBox.setText("There was an error");
    }
  };

  initUI() {
    this.containerEl.empty();
    this.containerEl.createEl("h4", {
      text: "Similar tags",
      cls: ["tree-item-self"],
    });

    this.suggestionBox = this.containerEl.createEl("div");
    this.suggestionBox.style.paddingLeft = "24px";

    this.loading = this.suggestionBox.createEl("div", {
      text: "Loading...",
    });
    this.loading.style.display = "none";
  }

  handleFileOpen = async (file: TFile) => {
    const content = await this.plugin.getTextFromFile(file);
    this.suggestTags(file, content);
  };

  async onOpen() {
    this.initUI();
    this.registerEvent(
      this.app.workspace.on("file-open", async (file) => {
        if (!this.plugin.settings.enableEarlyAccess) {
          return;
        }
        this.loading.style.display = "block";
        if (!file) {
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
