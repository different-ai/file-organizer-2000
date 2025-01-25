import { ItemView, WorkspaceLeaf } from "obsidian";
import { Root, createRoot } from "react-dom/client";
import { MainDashboard } from "./main-dashboard"; 
import { AppContext } from "../provider";
import FileOrganizer from "../../../index";  // Your main plugin class

export const DASHBOARD_VIEW_TYPE = "fo2k.dashboard";

export class DashboardView extends ItemView {
  root: Root | null = null;
  plugin: FileOrganizer;

  constructor(leaf: WorkspaceLeaf, plugin: FileOrganizer) {
    super(leaf);
    this.plugin = plugin;
  }

  getViewType(): string {
    return DASHBOARD_VIEW_TYPE;
  }

  getDisplayText(): string {
    return "File Organizer Dashboard";
  }

  getIcon(): string {
    return "sparkle";
  }

  async onOpen(): Promise<void> {
    const container = this.containerEl.children[1];
    this.root = createRoot(container);

    this.root.render(
      <AppContext.Provider value={{ plugin: this.plugin, root: this.root }}>
        <MainDashboard />
      </AppContext.Provider>
    );
  }

  async onClose(): Promise<void> {
    this.root?.unmount();
  }
} 