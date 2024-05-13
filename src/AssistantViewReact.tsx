import * as React from "react";
import { TFile } from "obsidian";
import FileOrganizer from ".";
import { logMessage } from "../utils";
import SkeletonLoader from "./SkeletonLoader";

interface AssistantViewProps {
  plugin: FileOrganizer;
}

const SectionHeader: React.FC<{ text: string; icon?: string }> = ({
  text,
  icon,
}) => (
  <h6 className="assistant-section-header">
    {icon && <span className="assistant-section-icon">{icon}</span>}
    {text}
  </h6>
);

const SimilarTags: React.FC<{
  plugin: FileOrganizer;
  file: TFile | null;
  content: string;
}> = ({ plugin, file, content }) => {
  const [suggestions, setSuggestions] = React.useState<string[] | null>(null);
  const [loading, setLoading] = React.useState<boolean>(false);

  React.useEffect(() => {
    const suggestTags = async () => {
      if (!content) {
        setSuggestions([]);
        return;
      }
      setSuggestions(null);
      setLoading(true);
      try {
        const tags = await plugin.getSimilarTags(content, file?.basename || "");
        setSuggestions(tags);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    suggestTags();
  }, [content]);

  return (
    <div className="assistant-section tags-section">
      <SectionHeader text="Similar tags" icon="🏷️" />
      {loading ? (
        <div className="tags-container">
          <SkeletonLoader height="2em" />
          <SkeletonLoader height="2em" />
          <SkeletonLoader height="2em" />
        </div>
      ) : (
        <div className="tags-container">
          {suggestions &&
            suggestions.map((tag, index) => (
              <span
                key={index}
                className="tag"
                onClick={() => plugin.appendTag(file!, tag)}
              >
                {tag}
              </span>
            ))}
          {!suggestions && <div>No tags found</div>}
          {suggestions && suggestions.length === 0 && <div>No tags found</div>}
        </div>
      )}
    </div>
  );
};

// Apply similar changes to other components like AliasSuggestionBox, SimilarFolderBox, etc.
const AliasSuggestionBox: React.FC<{
  plugin: FileOrganizer;
  file: TFile | null;
  content: string;
}> = ({ plugin, file, content }) => {
  const [alias, setAlias] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState<boolean>(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    const suggestAlias = async () => {
      if (!content) {
        setAlias(null);
        return;
      }
      setAlias(null);
      setLoading(true);
      setError(null);
      try {
        const suggestedAlias = await plugin.generateNameFromContent(content);
        setAlias(suggestedAlias);
        if (!suggestedAlias) {
          setError("No alias could be generated.");
        }
      } catch (err) {
        console.error("Failed to generate alias:", err);
        setError("Error generating alias.");
      } finally {
        setLoading(false);
      }
    };
    suggestAlias();
  }, [content]);

  return (
    <div className="assistant-section alias-section">
      <SectionHeader text="Suggested title" icon="💡" />
      {loading ? (
        <div>Loading...</div>
      ) : error ? (
        <div className="error-message">{error}</div>
      ) : (
        <div className="alias-container">
          {alias ? (
            <>
              <span className="alias">{alias}</span>
              <button
                className="rename-alias-button"
                onClick={() => {
                  if (file && file.parent) {
                    plugin.moveFile(file, alias, file.parent.path);
                  } else {
                    console.error("File or file parent is null.");
                  }
                }}
              >
                Rename File
              </button>
            </>
          ) : (
            <div>No suggestions found</div>
          )}
        </div>
      )}
    </div>
  );
};

const SimilarFolderBox: React.FC<{
  plugin: FileOrganizer;
  file: TFile | null;
  content: string;
}> = ({ plugin, file, content }) => {
  const [folder, setFolder] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState<boolean>(false);

  React.useEffect(() => {
    const suggestFolders = async () => {
      if (!content) {
        setFolder(null);
        return;
      }
      if (!file) {
        return;
      }
      setFolder(null);
      setLoading(true);
      try {
        const folder = await plugin.getAIClassifiedFolder(content, file);
        setFolder(folder);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    suggestFolders();
  }, [content]);

  return (
    <div className="assistant-section folders-section">
      <SectionHeader text="Similar folders" icon="📁" />
      {loading ? (
        <div className="folders-container">
          <SkeletonLoader height="2em" />
          <SkeletonLoader height="2em" />
          <SkeletonLoader height="2em" />
        </div>
      ) : (
        <div className="folders-container">
          {folder && (
            <span
              className="folder"
              onClick={() => plugin.moveFile(file!, folder)}
            >
              {folder}
            </span>
          )}
          {!folder && <div>No folders found</div>}
          {folder && folder.length === 0 && <div>No folders found</div>}
        </div>
      )}
    </div>
  );
};

const SimilarFilesBox: React.FC<{
  plugin: FileOrganizer;
  file: TFile | null;
}> = ({ plugin, file }) => {
  const [filePaths, setFilePaths] = React.useState<string[] | null>(null);
  const [loading, setLoading] = React.useState<boolean>(false);

  React.useEffect(() => {
    setFilePaths(null);
  }, [file]);

  const fetchSimilarFiles = async () => {
    try {
      if (!file) return;
      setFilePaths(null);
      setLoading(true);
      const similarFiles = await plugin.getSimilarFiles(file);
      setFilePaths(similarFiles);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="assistant-section files-section">
      <SectionHeader text="Similar files" icon="📄" />
      {loading ? (
        <div>Loading...</div>
      ) : (
        <button
          onClick={fetchSimilarFiles}
          className="load-similar-files-button"
        >
          Load Similar Files
        </button>
      )}

      <div className="files-container">
        {filePaths?.length === 0 && "No similar files found"}
        {filePaths &&
          filePaths.map((filePath, index) => (
            <div key={index} className="file">
              <a
                href="#"
                onClick={() => {
                  plugin.app.workspace.openLinkText(filePath, "/", false);
                }}
              >
                {filePath}
              </a>
            </div>
          ))}
      </div>
    </div>
  );
};

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
  const [formatting, setFormatting] = React.useState<boolean>(false);

  React.useEffect(() => {
    const fetchClassification = async () => {
      if (!content) return;
      try {
        setClassification(null);
        setLoading(true);
        const result = await plugin.classifyContent(
          content,
          file?.basename || ""
        );
        logMessage("ClassificationBox result", result);
        setClassification(result);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchClassification();
  }, [content]);

  if (!classification) return null;

  return (
    <div className="assistant-section classification-section">
      <button
        className="format-button"
        disabled={formatting}
        onClick={async () => {
          try {
            setFormatting(true);
            logMessage("ClassificationBox class", classification);
            logMessage("ClassificationBox content", content);
            await plugin.formatContent(file!, content, classification);
          } catch (error) {
            console.error(error);
          } finally {
            setFormatting(false);
          }
        }}
      >
        {formatting ? "Formatting..." : `Format as ${classification.type}`}
      </button>
    </div>
  );
};

export const AssistantView: React.FC<AssistantViewProps> = ({ plugin }) => {
  const [activeFile, setActiveFile] = React.useState<TFile | null>(null);
  const [noteContent, setNoteContent] = React.useState<string>("");
  const [loading, setLoading] = React.useState<boolean>(false);

  React.useEffect(() => {
    const onFileOpen = async () => {
      setLoading(true);
      await new Promise((resolve) => setTimeout(resolve, 500));
      if (plugin.app.workspace.rightSplit.collapsed) return;
      const file = plugin.app.workspace.getActiveFile();
      if (!file || !file.path || file.extension !== "md") {
        setActiveFile(null);
        setNoteContent("");
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
        setActiveFile(null);
        setNoteContent("");
        setLoading(false);
        return;
      }

      setActiveFile(file);
      const content = await plugin.getTextFromFile(file);
      setNoteContent(content);
      setLoading(false);
    };
    const fileOpenEventRef = plugin.app.workspace.on("file-open", onFileOpen);
    onFileOpen();

    return () => {
      plugin.app.workspace.offref(fileOpenEventRef);
    };
  }, []);

  if (!activeFile) {
    return (
      <div className="assistant-placeholder">
        Open a file to see AI suggestions
      </div>
    );
  }
  logMessage("AssistantView", activeFile);
  logMessage("AssistantView", activeFile.basename);

  return (
    <div className="assistant-container">
      <SectionHeader text="Looking at" icon="👀" />
      <div className="active-note-title">{activeFile.basename}</div>
      {loading && <div>Loading...</div>}

      {!loading && (
        <>
          <ClassificationBox
            plugin={plugin}
            file={activeFile}
            content={noteContent}
          />
          <SimilarTags
            plugin={plugin}
            file={activeFile}
            content={noteContent}
          />
          <AliasSuggestionBox
            plugin={plugin}
            file={activeFile}
            content={noteContent}
          />
          <SimilarFolderBox
            plugin={plugin}
            file={activeFile}
            content={noteContent}
          />
          <SimilarFilesBox plugin={plugin} file={activeFile} />
        </>
      )}
    </div>
  );
};
