import * as React from "react";
import { Notice, TFile, getLinkpath } from "obsidian";
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
      const result = await plugin.identifyConceptsAndFetchChunks(content);
      console.log("result", result);

      setConcepts(result.object.concepts.map((c) => c.name));
      setChunks(
        result.object.concepts.map((c) => ({
          concept: c.name,
          content: c.chunk,
        }))
      );
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
      {concepts.length > 0 && (
        <>
          {concepts.map((concept, index) => (
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
          ))}
        </>
      )}
    </div>
  );
};

const RenameSuggestion: React.FC<{
  plugin: FileOrganizer;
  file: TFile | null;
  content: string;
}> = ({ plugin, file, content }) => {
  const [alias, setTitle] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState<boolean>(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    const suggestAlias = async () => {
      if (!content) {
        setTitle(null);
        return;
      }
      setTitle(null);
      setLoading(true);
      setError(null);
      try {
        const suggestedAlias = await plugin.generateNameFromContent(
          content,
          file.basename
        );
        setTitle(suggestedAlias);
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

  const handleAliasClick = (alias: string) => {
    plugin.appendAlias(file, alias);
    setAliases((prevAliases) => prevAliases.filter((a) => a !== alias));
  };

  return (
    <div className="assistant-section alias-section">
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
                  onClick={() => handleAliasClick(alias)}
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
  formattingInstruction: string;
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
        // if (!file) return
        const fileContent = await plugin.app.vault.read(file!);
        console.log(fileContent);
        const result = await plugin.classifyContent(fileContent, file.basename);
        logMessage("ClassificationBox result", result);
        setClassification(result);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchClassification();
  }, [content, file]);

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

            const fileContent = await plugin.app.vault.read(file!);
            console.log({ fileContent });
            await plugin.formatContent(
              file!,
              fileContent,
              classification.formattingInstruction
            );
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

const hasAudioEmbed = (content: string): boolean => {
  const audioRegex = /!\[\[(.*\.(mp3|wav|m4a|ogg|webm))]]/i;
  return audioRegex.test(content);
};

const TranscriptionButton: React.FC<{
  plugin: FileOrganizer;
  file: TFile;
  content: string;
}> = ({ plugin, file, content }) => {
  const [transcribing, setTranscribing] = React.useState<boolean>(false);

  const handleTranscribe = async () => {
    setTranscribing(true);
    try {
      const audioRegex = /!\[\[(.*\.(mp3|wav|m4a|ogg|webm))]]/i;
      const match = content.match(audioRegex);
      if (match) {
        const audioFileName = match[1];

        const audioFile = plugin.app.metadataCache.getFirstLinkpathDest(
          audioFileName,
          "."
        );

        if (!(audioFile instanceof TFile)) {
          console.error("Audio file not found");
          new Notice("Audio file not found");
          return;
        }
        if (audioFile instanceof TFile) {
          const transcript = await plugin.generateTranscriptFromAudio(
            audioFile
          );
          await plugin.appendTranscriptToActiveFile(
            file,
            audioFileName,
            transcript
          );
          new Notice("Transcript added to the file");
        }
      }
    } catch (error) {
      console.error("Error transcribing audio:", error);
      new Notice("Error transcribing audio");
    } finally {
      setTranscribing(false);
    }
  };

  return (
    <button
      className="transcribe-button"
      onClick={handleTranscribe}
      disabled={transcribing}
    >
      {transcribing ? "Transcribing..." : "Transcribe Audio"}
    </button>
  );
};

// Add this new component for the refresh button
const RefreshButton: React.FC<{ onRefresh: () => void }> = ({ onRefresh }) => (
  <button className="refresh-button" onClick={onRefresh}>
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.3" />
    </svg>
  </button>
);

export const AssistantView: React.FC<AssistantViewProps> = ({ plugin }) => {
  const [activeFile, setActiveFile] = React.useState<TFile | null>(null);
  const [noteContent, setNoteContent] = React.useState<string>("");
  const [hasAudio, setHasAudio] = React.useState<boolean>(false);
  const [refreshKey, setRefreshKey] = React.useState<number>(0);

  const refreshAssistant = () => {
    setRefreshKey((prevKey) => prevKey + 1);
  };

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
      console.log("new content", content);
      setHasAudio(hasAudioEmbed(content));
    };
    const fileOpenEventRef = plugin.app.workspace.on("file-open", onFileOpen);
    onFileOpen();

    return () => {
      plugin.app.workspace.offref(fileOpenEventRef);
    };
  }, [refreshKey]); // Add refreshKey to the dependency array

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

      {/* <SectionHeader text="Classification" icon="🗂️" /> */}
      <ClassificationBox
        plugin={plugin}
        file={activeFile}
        content={noteContent}
      />

      <SectionHeader text="Similar tags" icon="🏷️" />
      <SimilarTags plugin={plugin} file={activeFile} content={noteContent} />

      <SectionHeader text="Suggested title" icon="💡" />
      <RenameSuggestion
        plugin={plugin}
        file={activeFile}
        content={noteContent}
      />
      {plugin.settings.enableAliasGeneration && (
        <>
          <SectionHeader text="Suggested aliases" icon="💡" />

          <AliasSuggestionBox
            plugin={plugin}
            file={activeFile}
            content={noteContent}
          />
        </>
      )}

      <SectionHeader text="Suggested folder" icon="📁" />
      <SimilarFolderBox
        plugin={plugin}
        file={activeFile}
        content={noteContent}
      />

      {plugin.settings.enableSimilarFiles && (
        <>
          <SectionHeader text="Similar files" icon="📄" />
          <SimilarFilesBox plugin={plugin} file={activeFile} />
        </>
      )}
      {plugin.settings.enableAtomicNotes && (
        <>
          <SectionHeader text="Atomic notes" icon="✂️" />
          <DocumentChunks plugin={plugin} activeFile={activeFile} />
        </>
      )}
      {hasAudio && (
        <>
          <SectionHeader text="Audio Transcription" icon="🎙️" />
          <TranscriptionButton
            plugin={plugin}
            file={activeFile}
            content={noteContent}
          />
        </>
      )}
      <div className="assistant-header">
        <SectionHeader text="Refresh Suggestions" />

        <RefreshButton onRefresh={refreshAssistant} />
      </div>
    </div>
  );
};