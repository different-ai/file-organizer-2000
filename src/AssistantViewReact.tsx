import * as React from "react";
import { TFile } from "obsidian";
import FileOrganizer from ".";
import { logMessage } from "../utils";

interface AssistantViewProps {
  plugin: FileOrganizer;
}

export const AssistantView: React.FC<AssistantViewProps> = ({ plugin }) => {
  const [selectedFile, setSelectedFile] = React.useState<TFile | null>(null);
  const [suggestionBox, setSuggestionBox] = React.useState<string>("");
  const [loading, setLoading] = React.useState<boolean>(false);
  const [similarFolderBox, setSimilarFolderBox] = React.useState<string>("");
  const [aliasSuggestionBox, setAliasSuggestionBox] =
    React.useState<string>("");
  const [classificationBox, setClassificationBox] = React.useState<string>("");
  const [similarFilesBox, setSimilarFilesBox] = React.useState<string[]>([]);
  logMessage("AssistantView", plugin);

  React.useEffect(() => {
    const handleFileOpen = async (file: TFile | null) => {
      const rightSplit = plugin.app.workspace.rightSplit;
      logMessage(rightSplit, "rightSplit");

      if (rightSplit.collapsed) return;

      
      setLoading(true);
      if (!file) {
        setSuggestionBox("No file opened");
        setLoading(false);
        return;
      }

      const settingsPaths = [
        plugin.settings.pathToWatch,
        plugin.settings.defaultDestinationPath,
        plugin.settings.attachmentsPath,
        plugin.settings.logFolderPath,
        plugin.settings.templatePaths,
      ];
      const isInSettingsPath = settingsPaths.some((path) =>
        file.path.includes(path)
      );
      if (isInSettingsPath) {
        setSuggestionBox(
          "This is is part of an ignored folder in FileOrganizer. Sidebar disabled."
        );
        setLoading(false);
        return;
      }

      if (!file.extension.includes("md")) {
        setSuggestionBox("The AI Assistant only works with markdown files.");
        setLoading(false);
        return;
      }

      const aiAssistantSidebar = document.querySelector(
        ".assistant-container"
      ) as HTMLElement;

      if (aiAssistantSidebar) {
        aiAssistantSidebar.style.display = "none";
      }

      await displayTitle(file);
      const content = await plugin.getTextFromFile(file);
      await suggestTags(file, content);
      await suggestFolders(file, content);
      await displaySimilarFiles(file);
      await suggestAlias(file, content);
      await displayClassification(file, content);

      if (aiAssistantSidebar) {
        aiAssistantSidebar.style.display = "";
      }
      setLoading(false);
    };

    const fileOpenEventRef = plugin.app.workspace.on(
      "file-open",
      handleFileOpen
    );

    return () => {
      plugin.app.workspace.offref(fileOpenEventRef);
    };
  }, []);

  const displayTitle = async (file: TFile) => {
    const title = file.basename;
    setSelectedFile(file);
  };

  const suggestTags = async (file: TFile, content: string) => {
    const tags = await plugin.getSimilarTags(content, file.basename);

    if (tags.length > 0) {
      const tagsElement = tags.map((tag, index) => (
        <span
          key={index}
          className="cursor-pointer cm-hashtag cm-hashtag-begin cm-meta cm-tag cm-hashtag-end"
          style={{
            cursor: "pointer",
            margin: index === 0 ? "0px" : "2px",
            fontSize: "1rem",
          }}
          onClick={() => {
            const normalizedTag = tag.startsWith("#") ? tag : `#${tag}`;
            plugin.appendTag(file, normalizedTag);
            setSuggestionBox((prevTags) =>
              prevTags.filter((t) => t !== normalizedTag)
            );
          }}
        >
          {tag}
        </span>
      ));
      setSuggestionBox(tagsElement);
    } else {
      setSuggestionBox("No suggestions");
    }
  };

  const suggestAlias = async (file: TFile, content: string) => {
    const suggestedName = await plugin.generateNameFromContent(content);
    setAliasSuggestionBox(
      <>
        <span style={{ fontSize: "1rem", color: "var(--text-accent)" }}>
          {suggestedName}
        </span>
        <span
          className="clickable-icon setting-editor-extra-setting-button"
          style={{ cursor: "pointer", margin: "5px" }}
          onClick={async () => {
            logMessage(
              "Adding alias " + suggestedName + " to " + file.basename
            );
            await plugin.appendToFrontMatter(file, "alias", suggestedName);
          }}
        >
          +
        </span>
      </>
    );
  };

  const suggestFolders = async (file: TFile, content: string) => {
    const folder = await plugin.getAIClassifiedFolder(content, file);
    setSimilarFolderBox(
      <>
        <span>{folder}</span>
        <div
          className="clickable-icon setting-editor-extra-setting-button"
          style={{ cursor: "pointer", margin: "5px" }}
          onClick={() => {
            plugin.moveContent(file, file.basename, folder);
          }}
        >
          Move
        </div>
      </>
    );
  };

  const displaySimilarFiles = async (file: TFile) => {
    const similarFiles = await plugin.getSimilarFiles(file);
    logMessage(similarFiles);

    if (similarFiles.length > 0) {
      const filesElement = similarFiles.map((similarFile, index) => (
        <div
          key={index}
          className="similar-file"
          style={{ marginBottom: "5px" }}
        >
          <a
            style={{ color: "var(--text-accent)", cursor: "pointer" }}
            onClick={(event) => {
              event.preventDefault();
              const path = plugin.app.metadataCache.getFirstLinkpathDest(
                similarFile,
                ""
              );
              logMessage(path);
              plugin.app.workspace.openLinkText(path, "/", false);
            }}
          >
            {similarFile}
          </a>
        </div>
      ));
      setSimilarFilesBox(filesElement);
    } else {
      setSimilarFilesBox(["No similar files found"]);
    }
  };

  const displayClassification = async (file: TFile, content: string) => {
    logMessage("Checking document type");
    const classification = await plugin.useCustomClassifier(
      content,
      file.basename
    );
    logMessage("Current document type: " + classification?.type);

    if (classification) {
      setClassificationBox(
        <>
          <span style={{ color: "var(--text-accent)", fontSize: "1rem" }}>
            {classification.type}
          </span>
          <button
            className="sidebar-format-button"
            onClick={async () => {
              await plugin.formatContent(file, content, classification);
            }}
          >
            Apply Template
          </button>
        </>
      );
    } else {
      setClassificationBox("");
    }
  };

  return (
    <div className="assistant-container">
      <h6>Looking at</h6>
      <div>{selectedFile?.basename}</div>

      <h6>Similar tags</h6>

      <div>{suggestionBox}</div>

      <h6>Suggested alias</h6>
      <div>{aliasSuggestionBox}</div>

      <h6>Suggested folder</h6>
      <div>{similarFolderBox}</div>

      {/* <h6>Looks like </h6>
      <div>{classificationBox}</div>
 */}
      <h6>Similar files</h6>
      <div>{similarFilesBox}</div>

      {loading && <div>Loading...</div>}
    </div>
  );
};
