import * as React from "react";
import { TFile } from "obsidian";
import FileOrganizer from ".";
import { logMessage } from "../utils";

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
      if (!file) return;
      if (!content) {
        setSuggestions([]);
        return;
      }
      setSuggestions(null);
      setLoading(true);
      try {
        const tags = await plugin.getSimilarTags(content, file.basename);
        setSuggestions(tags);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    suggestTags();
  }, [file, content]);

  return (
    <div className="assistant-section tags-section">
      <SectionHeader text="Similar tags" icon="🏷️" />
      {loading ? (
        <div>Loading...</div>
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
        </div>
      )}
    </div>
  );
};

const AliasSuggestionBox: React.FC<{
  plugin: FileOrganizer;
  file: TFile | null;
  content: string;
}> = ({ plugin, file, content }) => {
  const [alias, setAlias] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState<boolean>(false);

  React.useEffect(() => {
    const suggestAlias = async () => {
      if (!file || !content) return;
      setAlias(null);
      setLoading(true);
      const suggestedAlias = await plugin.generateNameFromContent(content);
      setAlias(suggestedAlias);
      setLoading(false);
    };
    suggestAlias();
  }, [file, content]);

  return (
    <div className="assistant-section alias-section">
      <SectionHeader text="Suggested alias" icon="💡" />
      {loading ? (
        <div>Loading...</div>
      ) : (
        <div className="alias-container">
          {alias && (
            <>
              <span className="alias">{alias}</span>
              {/* <button
                className="add-alias-button"
                onClick={() =>
                  plugin.appendToFrontMatter(file!, "alias", alias)
                }
              >
                Add
              </button> */}
              <button
                className="rename-alias-button"
                onClick={() => {
                  plugin.moveContent(file!, alias);
                }}
              >
                Rename File
              </button>
            </>
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
    const suggestFolder = async () => {
      if (!file || !content) return;
      setFolder(null);
      setLoading(true);
      const suggestedFolder = await plugin.getAIClassifiedFolder(content, file);
      setFolder(suggestedFolder);
      setLoading(false);
    };
    suggestFolder();
  }, [file, content]);

  return (
    <div className="assistant-section folder-section">
      <SectionHeader text="Suggested folder" icon="📁" />
      {loading ? (
        <div>Loading...</div>
      ) : (
        <div className="folder-container">
          <span className="folder">{folder}</span>
          <button
            className="move-note-button"
            onClick={() => plugin.moveContent(file!, file!.basename, folder)}
          >
            Move
          </button>
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
      {loading && <button>Loading...</button>}
      {!loading && !filePaths && (
        <button onClick={fetchSimilarFiles}>Load Similar Files</button>
      )}

      <div className="files-container">
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
      if (!file || !content) return;
      try {
        setClassification(null);
        setLoading(true);
        const result = await plugin.classifyContent(content, file.basename);
        setClassification(result);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchClassification();
  }, [file, content]);

  if (!classification) return null;

  return (
    <div className="assistant-section classification-section">
      <button
        className="format-button"
        disabled={formatting}
        onClick={async () => {
          try {
            setFormatting(true);
            await plugin.formatContent(file!, content, classification);
            setFormatting(false);
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

  React.useEffect(() => {
    const onFileOpen = async () => {
      setActiveFile(null);
      setNoteContent("");
      const file = plugin.app.workspace.getActiveFile();
      if (plugin.app.workspace.rightSplit.collapsed) return;

      if (!file || !file.path) {
        setActiveFile(null);
        setNoteContent("");
        return;
      }
      // if it's not a markdown file, don't show the assistant
      if (file.extension !== "md") {
        setActiveFile(null);
        setNoteContent("");
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
        return;
      }

      setActiveFile(file);
      const content = await plugin.getTextFromFile(file);
      setNoteContent(content);
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

      <ClassificationBox
        plugin={plugin}
        file={activeFile}
        content={noteContent}
      />
      <SimilarTags plugin={plugin} file={activeFile} content={noteContent} />
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
    </div>
  );
};
