import * as React from "react";
import { TFile } from "obsidian";
import FileOrganizer from ".";
import { logMessage } from "../utils";

interface AssistantViewProps {
  plugin: FileOrganizer;
}

const SuggestionBox: React.FC<{
  plugin: FileOrganizer;
  file: TFile | null;
  content: string;
}> = ({ plugin, file, content }) => {
  const [suggestionBox, setSuggestionBox] = React.useState<JSX.Element | null>(
    null
  );
  const [loading, setLoading] = React.useState<boolean>(false);

  React.useEffect(() => {
    const suggestTags = async () => {
      if (!file || !content) return;
      setLoading(true);
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
                prevTags!.filter((t) => t !== normalizedTag)
              );
            }}
          >
            {tag}
          </span>
        ));
        setSuggestionBox(tagsElement);
      } else {
        setSuggestionBox(<span>No suggestions</span>);
      }
      setLoading(false);
    };
    suggestTags();
  }, [file, content]);

  return (
    <>
      <h6>Similar tags</h6>
      {loading ? <div>Loading...</div> : <div>{suggestionBox}</div>}
    </>
  );
};

const AliasSuggestionBox: React.FC<{
  plugin: FileOrganizer;
  file: TFile | null;
  content: string;
}> = ({ plugin, file, content }) => {
  const [aliasSuggestionBox, setAliasSuggestionBox] =
    React.useState<JSX.Element | null>(null);
  const [loading, setLoading] = React.useState<boolean>(false);

  React.useEffect(() => {
    const suggestAlias = async () => {
      if (!file || !content) return;
      setLoading(true);
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
      setLoading(false);
    };
    suggestAlias();
  }, [file, content]);

  return (
    <>
      <h6>Suggested alias</h6>
      {loading ? <div>Loading...</div> : <div>{aliasSuggestionBox}</div>}
    </>
  );
};

const SimilarFolderBox: React.FC<{
  plugin: FileOrganizer;
  file: TFile | null;
  content: string;
}> = ({ plugin, file, content }) => {
  const [similarFolderBox, setSimilarFolderBox] =
    React.useState<JSX.Element | null>(null);
  const [loading, setLoading] = React.useState<boolean>(false);

  React.useEffect(() => {
    const suggestFolders = async () => {
      if (!file || !content) return;
      setLoading(true);
      const folder = await plugin.getAIClassifiedFolder(content, file);
      setSimilarFolderBox(
        <div style={{ display: "flex", alignItems: "center" }}>
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
        </div>
      );
      setLoading(false);
    };
    suggestFolders();
  }, [file, content]);

  return (
    <>
      <h6>Suggested folder</h6>
      {loading ? <div>Loading...</div> : <div>{similarFolderBox}</div>}
    </>
  );
};

const SimilarFilesBox: React.FC<{
  plugin: FileOrganizer;
  file: TFile | null;
}> = ({ plugin, file }) => {
  const [similarFilesBox, setSimilarFilesBox] =
    React.useState<JSX.Element | null>(null);
  const [loading, setLoading] = React.useState<boolean>(false);

  React.useEffect(() => {
    const displaySimilarFiles = async () => {
      if (!file) return;
      setLoading(true);
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
              style={{
                color: "var(--text-accent)",
                cursor: "pointer",
                //   remove underline
                textDecoration: "none",
              }}
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
              {similarFile.replace(".md", "")}
            </a>
          </div>
        ));
        setSimilarFilesBox(<>{filesElement}</>);
      } else {
        setSimilarFilesBox(<span>No similar files found</span>);
      }
      setLoading(false);
    };
    displaySimilarFiles();
  }, [file]);

  return (
    <>
      <h6>Similar files</h6>
      {loading ? <div>Loading...</div> : <div>{similarFilesBox}</div>}
    </>
  );
};

// src/types.ts
export interface Classification {
  type: string;
  formattingInstructions: string;
}

const ClassificationBox: React.FC<{
  plugin: FileOrganizer;
  file: TFile | null;
  content: string;
}> = ({ plugin, file, content }) => {
  const [classification, setClassification] =
    React.useState<Classification | null>(null);
  const [loading, setLoading] = React.useState<boolean>(false);
  const [buttonLoading, setButtonLoading] = React.useState<boolean>(false);

  React.useEffect(() => {
    const fetchClassification = async () => {
      if (!file || !content) return;

      setLoading(true);
      logMessage("Checking document type");

      const result = await plugin.useCustomClassifier(content, file.basename);
      setClassification(result);

      logMessage("Current document type: " + result?.type);
      setLoading(false);
    };

    fetchClassification();
  }, [file, content]);

  if (!file) return null;
  if (file.extension !== "md") return null;
  if (!classification) return null;
  if (loading) return null;

  return (
    <button
      className="sidebar-format-button"
      disabled={buttonLoading}
      onClick={async () => {
        setButtonLoading(true);
        await plugin.formatContent(file, content, classification);
        setButtonLoading(false);
      }}
    >
      {buttonLoading
        ? "Applying template..."
        : `Apply ${classification.type} template`}
    </button>
  );
};

export const AssistantView: React.FC<AssistantViewProps> = ({ plugin }) => {
  const [selectedFile, setSelectedFile] = React.useState<TFile | null>(null);
  const [content, setContent] = React.useState<string>("");
  const [loading, setLoading] = React.useState<boolean>(false);

  React.useEffect(() => {
    const handleFileOpen = async (file: TFile | null) => {
      const rightSplit = plugin.app.workspace.rightSplit;
      logMessage(rightSplit, "rightSplit");

      if (rightSplit.collapsed) return;

      setLoading(true);
      if (!file) {
        setSelectedFile(null);
        setContent("");
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
        setSelectedFile(null);
        setContent("");
        setLoading(false);
        return;
      }

      if (!file.extension.includes("md")) {
        setSelectedFile(null);
        setContent("");
        setLoading(false);
        return;
      }

      setSelectedFile(file);
      const content = await plugin.getTextFromFile(file);
      setContent(content);
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

  return (
    <div className="assistant-container">
      <h6>Looking at</h6>
      <div>{selectedFile?.basename}</div>

      {loading ? (
        <div>Loading...</div>
      ) : (
        <>
          <SuggestionBox
            plugin={plugin}
            file={selectedFile}
            content={content}
          />
          <AliasSuggestionBox
            plugin={plugin}
            file={selectedFile}
            content={content}
          />

          <SimilarFolderBox
            plugin={plugin}
            file={selectedFile}
            content={content}
          />

          <SimilarFilesBox plugin={plugin} file={selectedFile} />
          <ClassificationBox
            plugin={plugin}
            file={selectedFile}
            content={content}
          />
        </>
      )}
    </div>
  );
};
