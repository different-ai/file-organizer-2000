import { ItemView, WorkspaceLeaf } from "obsidian";
import FileOrganizer from ".";

export const ASSISTANT_VIEW_TYPE = "fo2k.assistant.sidebar";

export class AssistantView extends ItemView {
  private readonly plugin: FileOrganizer;

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

  async onOpen() {
    const container = this.containerEl.children[1];
    container.empty();
    container.createEl("h4", { text: "Assistant" });
    const suggestion = container.createEl("div", {
      text: "No suggestions",
    });
    const loading = container.createEl("div", {
      text: "Loading...",
      attr: { style: "display: none;" },
    });
    loading.hide();
    this.registerEvent(
      this.app.workspace.on("file-open", async (file) => {
        loading.show();
        if (!file) return;
        const content = await this.plugin.getTextFromFile(file);
        const tags = await this.plugin.getSimilarTags(content, file?.basename);
        suggestion.setText(tags.join(", "));
        loading.hide();
      })
    );
  }

  async onClose() {
    // Nothing to clean up.
  }
}
