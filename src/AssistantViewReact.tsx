import * as React from "react";
import { TFile } from "obsidian";
import FileOrganizer from ".";
import { logMessage } from "../utils";
import { log } from "console";

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
        const tags = await plugin.getSimilarTags(content, file.basename);
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
          {!suggestions && <div>No tags found</div>}
          {suggestions && suggestions.length === 0 && <div>No tags found</div>}
        </div>
      )}
    </div>
  );
};

const DocumentChunks: React.FC<{
  plugin: FileOrganizer;
  activeFile: TFile;
}> = ({ plugin, activeFile }) => {
  const [concepts, setConcepts] = React.useState<string[]>([]);
  const [chunks, setChunks] = React.useState<
    { concept: string; content: string }[]
  >([]);
  const [loading, setLoading] = React.useState<boolean>(false);

  const parseDocument = async () => {
    setLoading(true);
    try {
      const content = await plugin.app.vault.read(activeFile);
      const identifiedConcepts = await plugin.identifyConcepts(content);
      setConcepts(identifiedConcepts);

      for (const concept of identifiedConcepts) {
        const conceptChunk = await plugin.fetchChunkForConcept(
          content,
          concept
        );
        setChunks((prevChunks) => [
          ...prevChunks,
          { concept, content: conceptChunk.content },
        ]);
      }
    } catch (error) {
      console.error("Error parsing document:", error);
    } finally {
      setLoading(false);
    }
  };

  const addToInbox = async (chunkContent: string) => {
    try {
      await plugin.createFileInInbox(chunkContent);
    } catch (error) {
      console.error("Error adding to inbox:", error);
    }
  };

  return (
    <div className="document-chunks">
      <button onClick={parseDocument} disabled={loading}>
        {loading ? "Parsing..." : "Parse Document"}
      </button>
      {concepts.length > 0 ? (
        concepts.map((concept, index) => (
          <div key={index}>
            <h4>{concept}</h4>
            {chunks
              .filter((chunk) => chunk.concept === concept)
              .map((chunk, chunkIndex) => (
                <div key={chunkIndex} className="chunk-container">
                  <div className="chunk-content">
                    <p>{chunk.content}</p>
                    <button onClick={() => addToInbox(chunk.content)}>
                      Add to Inbox
                    </button>
                  </div>
                </div>
              ))}
          </div>
        ))
      ) : (
        <div>No concepts found</div>
      )}
    </div>
  );
};

const RenameSuggestionBox: React.FC<{
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
        <div className="error-message">{}</div>
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

const AliasSuggestionBox: React.FC<{
  plugin: FileOrganizer;
  file: TFile | null;
  content: string;
}> = ({ plugin, file, content }) => {
  const [aliases, setAliases] = React.useState<string[]>([]);
  const [loading, setLoading] = React.useState<boolean>(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    const suggestAliases = async () => {
      if (!content) {
        setAliases([]);
        return;
      }
      setAliases([]);
      setLoading(true);
      setError(null);
      try {
        const generatedAliases = await plugin.generateAliasses(
          file.basename,
          content
        );
        setAliases(generatedAliases);
      } catch (err) {
        console.error("Failed to generate aliases:", err);
        setError("Error generating aliases.");
      } finally {
        setLoading(false);
      }
    };
    suggestAliases();
  }, [content]);

  return (
    <div className="assistant-section alias-section">
      <SectionHeader text="Suggested aliases" icon="💡" />
      {loading ? (
        <div>Loading...</div>
      ) : error ? (
        <div className="error-message">{error}</div>
      ) : (
        <div className="alias-container">
          {aliases.length > 0 ? (
            <>
              {aliases.map((alias, index) => (
                <span
                  key={index}
                  className="alias tag"
                  onClick={() => plugin.appendAlias(file, alias)}
                >
                  {alias}
                </span>
              ))}
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
    const suggestFolder = async () => {
      if (!content) return;
      setFolder(null);
      setLoading(true);
      const suggestedFolder = await plugin.getAIClassifiedFolder(
        content,
        file.path
      );
      setFolder(suggestedFolder);
      setLoading(false);
    };
    suggestFolder();
  }, [content]);

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
            onClick={() => plugin.moveFile(file!, file!.basename, folder)}
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
        <button
          onClick={fetchSimilarFiles}
          className="load-similar-files-button"
        >
          Load Similar Files
        </button>
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
      if (!content) return;
      try {
        setClassification(null);
        setLoading(true);
        const result = await plugin.classifyContent(content, file.basename);
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
      // force slow down
      await new Promise((resolve) => setTimeout(resolve, 500));
      if (plugin.app.workspace.rightSplit.collapsed) return;
      const file = plugin.app.workspace.getActiveFile();
      console.log("file", file);
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
      <RenameSuggestionBox
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

      <DocumentChunks plugin={plugin} activeFile={activeFile} />
    </div>
  );
};
