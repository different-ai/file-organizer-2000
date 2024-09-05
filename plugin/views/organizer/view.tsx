import * as React from "react";
import { Notice, TFile, WorkspaceLeaf} from "obsidian";
import FileOrganizer, { validMediaExtensions } from "../../index";

interface AssistantViewProps {
  plugin: FileOrganizer;
  leaf: WorkspaceLeaf;
}

const SectionHeader: React.FC<{ 
  text: string; 
  icon?: string; 
}> = ({
  text,
  icon,
}) => {



  return (
    <h6 className="assistant-section-header">
      {icon && <span className="assistant-section-icon">{icon}</span>}
      {text}
    </h6>
  );
};

const SimilarTags: React.FC<{
  plugin: FileOrganizer;
  file: TFile | null;
  content: string;
  refreshKey: number;
}> = ({ plugin, file, content, refreshKey }) => {
  const [existingTags, setExistingTags] = React.useState<string[] | null>(null);
  const [newTags, setNewTags] = React.useState<string[] | null>(null);
  const [loading, setLoading] = React.useState<boolean>(false);

  React.useEffect(() => {
    const suggestTags = async () => {
      if (!content || !file) {
        setExistingTags([]);
        setNewTags([]);
        return;
      }
      setExistingTags(null);
      setNewTags(null);
      setLoading(true);
      try {
        const vaultTags = await plugin.getAllVaultTags();
        const [existingTagsResult, newTagsResult] = await Promise.all([
          plugin.getExistingTags(content, file.basename, vaultTags),
          plugin.getNewTags(content, file.basename)
        ]);
        setExistingTags(existingTagsResult);
        // Filter out any new tags that are already in existingTags
        const filteredNewTags = newTagsResult.filter(tag => !existingTagsResult.includes(tag));
        setNewTags(filteredNewTags);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    suggestTags();
  }, [content, refreshKey]);

  const allTags = React.useMemo(() => {
    const uniqueTags = new Set([...(existingTags || []), ...(newTags || [])]);
    return Array.from(uniqueTags);
  }, [existingTags, newTags]);

  return (
    <div className="assistant-section tags-section">
      {loading ? (
        <div>Loading...</div>
      ) : (
        <div className="tags-container">
          {allTags.map((tag, index) => (
            <span
              key={index}
              className={`tag ${existingTags?.includes(tag) ? 'existing-tag' : 'new-tag'}`}
              onClick={() => plugin.appendTag(file!, tag)}
            >
        #{tag.replace(/^#+/, '')}
            </span>
          ))}
          {allTags.length === 0 && (
            <div>No tags found</div>
          )}
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
      <button onClick={parseDocument} disabled={loading} className="parse-document-button">
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
  refreshKey: number;
}> = ({ plugin, file, content, refreshKey }) => {
  const [alias, setTitle] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState<boolean>(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    const suggestAlias = async () => {
      if (!content || !file) {
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
          setError("No title could be generated.");
        }
      } catch (err) {
        console.error("Failed to generate title:", err);
        setError("Error generating title.");
      } finally {
        setLoading(false);
      }
    };
    suggestAlias();
  }, [content, refreshKey]);

  return (
    <div className="assistant-section alias-section">
      {loading ? (
        <div>Loading...</div>
      ) : error ? (
        <div className="error-container">{error}</div>
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
                Rename
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
  refreshKey: number;
}> = ({ plugin, file, content, refreshKey }) => {
  const [aliases, setAliases] = React.useState<string[]>([]);
  const [loading, setLoading] = React.useState<boolean>(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    const suggestAliases = async () => {
      if (!content || !file) {
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
  }, [content, refreshKey]);

  const handleAliasClick = (alias: string) => {
    plugin.appendAlias(file, alias);
    setAliases((prevAliases) => prevAliases.filter((a) => a !== alias));
  };

  return (
    <div className="assistant-section alias-section">
      {loading ? (
        <div>Loading...</div>
      ) : error ? (
        <div className="error-container">{error}</div>
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
  refreshKey: number;
}> = ({ plugin, file, content, refreshKey }) => {
  const [folder, setFolder] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState<boolean>(false);

  React.useEffect(() => {
    const suggestFolder = async () => {
      if (!content || !file) return;
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
  }, [content, refreshKey]);

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
          Load
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

interface Template {
  type: string;
  formattingInstruction: string;
}

const ClassificationBox: React.FC<{
  plugin: FileOrganizer;
  file: TFile | null;
  content: string;
  refreshKey: number;
}> = ({ plugin, file, content, refreshKey }) => {
  const [classification, setClassification] = React.useState<Classification | null>(null);
  const [templates, setTemplates] = React.useState<Template[]>([]);
  const [selectedTemplate, setSelectedTemplate] = React.useState<Template | null>(null);
  const [showDropdown, setShowDropdown] = React.useState<boolean>(false);
  const [formatting, setFormatting] = React.useState<boolean>(false);
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const fetchClassificationAndTemplates = async () => {
      if (!content || !file) return;
      try {
        const fileContent = await plugin.app.vault.read(file!);
        const result = await plugin.classifyContent(fileContent, file!.basename);
        setClassification(result);
        setSelectedTemplate(result); // Set the initial classification as the selected template
        const fetchedTemplates = await plugin.getTemplates();
        setTemplates(fetchedTemplates);
      } catch (error) {
        console.error(error);
      }
    };
    fetchClassificationAndTemplates();

    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [content, file, plugin, refreshKey]);

  const handleFormat = async (template: Template) => {
    try {
      setFormatting(true);
      const fileContent = await plugin.app.vault.read(file!);
      await plugin.formatContent(file!, fileContent, template.formattingInstruction);
      setClassification(template);
      setSelectedTemplate(null);
    } catch (error) {
      console.error(error);
    } finally {
      setFormatting(false);
    }
  };

  const getDisplayText = () => {
    if (selectedTemplate) {
      return `Format as ${selectedTemplate.type}`;
    }
    return 'Select template';
  };

  const dropdownTemplates = templates.filter(t => t.type !== selectedTemplate?.type);

  return (
    <div className="assistant-section classification-section">
      <SectionHeader text="Templates" icon="🗂️" />
      <div className="template-selection-container">
        <div className="split-button-container" ref={dropdownRef}>
          <button
            className="split-button-main"
            onClick={() => setShowDropdown(!showDropdown)}
          >
            <span className="split-button-text">{getDisplayText()}</span>
            <svg className="split-button-arrow" width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M6 9L12 15L18 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          {showDropdown && (
            <div className={`dropdown-menu ${showDropdown ? 'show' : ''}`}>
              {dropdownTemplates.map((template, index) => (
                <div
                  key={index}
                  className="dropdown-item"
                  onClick={() => {
                    setSelectedTemplate(template);
                    setShowDropdown(false);
                  }}
                >
                  {template.type}
                </div>
              ))}
              {dropdownTemplates.length === 0 && (
                <div className="dropdown-item">No other templates available</div>
              )}
            </div>
          )}
        </div>
        <button
          className="apply-template-button"
          disabled={!selectedTemplate || formatting}
          onClick={() => selectedTemplate && handleFormat(selectedTemplate)}
        >
          {formatting ? "Applying..." : "Apply"}
        </button>
      </div>
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

const RefreshButton: React.FC<{ onRefresh: () => void }> = ({ onRefresh }) => {
  const [isSpinning, setIsSpinning] = React.useState(false);

  const handleRefresh = () => {
    setIsSpinning(true);
    onRefresh();
    setTimeout(() => setIsSpinning(false), 1000); // Stop spinning after 1 second
  };

  return (
    <button className={`refresh-button flex items-center ${isSpinning ? 'spinning' : ''}`} onClick={handleRefresh}>
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
        className="mr-2"
      >
        <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.3" />
      </svg>
      <span style={{ marginLeft: "10px" }}>Refresh Context</span>
    </button>
  );
};


export const AssistantView: React.FC<AssistantViewProps> = ({ plugin, leaf }) => {
  const [activeFile, setActiveFile] = React.useState<TFile | null>(null);
  const [noteContent, setNoteContent] = React.useState<string>("");
  const [hasAudio, setHasAudio] = React.useState<boolean>(false);
  const [refreshKey, setRefreshKey] = React.useState<number>(0);

  const refreshAssistant = () => {
    setRefreshKey((prevKey) => prevKey + 1);
  };

  React.useEffect(() => {
    const onFileOpen = async () => {
      // Check if the Assistant view is visible before processing
      const isVisible = leaf.view.containerEl.isShown() && !plugin.app.workspace.rightSplit.collapsed;
      
      if (!isVisible) return;
      
      // force slow down
      await new Promise((resolve) => setTimeout(resolve, 500));
      const file = plugin.app.workspace.getActiveFile();

      if (!file || !file.path) {
        setActiveFile(null);
        setNoteContent("");
        return;
      }

      // Check if it's a media file
      if (isMediaFile(file)) {
        setActiveFile(file);
        setNoteContent(""); // or set some placeholder content for media files
        return;
      }

      // if it's not a markdown file, set active file to null, so that it  doesn't show the assistant view items
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
    const layoutChangeRef = plugin.app.workspace.on("layout-change", onFileOpen);
    onFileOpen();

    return () => {
      plugin.app.workspace.offref(fileOpenEventRef);
      plugin.app.workspace.offref(layoutChangeRef);
    };
  }, [refreshKey, plugin.app.workspace, plugin.app.vault, leaf]);

  const isMediaFile = (file: TFile | null): boolean => {
    if (!file) return false;
    return validMediaExtensions.includes(file.extension);
  };




  // if active file is null, display a placeholder (e.g. when opening a file in the Fo2k folder)
  if (!activeFile) {
    return (
      <div className="assistant-placeholder">
        Open a file outside the File Organizer 2000 folder to see AI suggestions
      </div>
    );
  }

  // if active file is media file,  display a different UI
  if (isMediaFile(activeFile)) {
    return (
      <div className="assistant-placeholder">
        To process an image or audio file, move it to the File Organizer 2000
        Inbox Folder (e.g. for image text extraction or audio transcription).
      </div>
    );
  }

  return (
    <div className="assistant-container">
      <div className="assistant-header">
        <SectionHeader text="Looking at" icon="👀" />
        <div className="active-note-title">{activeFile.basename}</div>
        <RefreshButton onRefresh={refreshAssistant} />
      </div>
      <ClassificationBox
        plugin={plugin}
        file={activeFile}
        content={noteContent}
        refreshKey={refreshKey}
      />

      <SectionHeader 
        text="Tags"
        icon="🏷️" 
      />
      <SimilarTags 
        plugin={plugin} 
        file={activeFile} 
        content={noteContent} 
        refreshKey={refreshKey} 
      />

      <SectionHeader text="Suggested title" icon="💡" />
      <RenameSuggestion
        plugin={plugin}
        file={activeFile}
        content={noteContent}
        refreshKey={refreshKey}
      />
      {plugin.settings.enableAliasGeneration && (
        <>
          <SectionHeader text="Suggested aliases" icon="💡" />

          <AliasSuggestionBox
            plugin={plugin}
            file={activeFile}
            content={noteContent}
            refreshKey={refreshKey}
          />
        </>
      )}

      <SectionHeader text="Suggested folder" icon="📁" />
      <SimilarFolderBox
        plugin={plugin}
        file={activeFile}
        content={noteContent}
        refreshKey={refreshKey}
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
    </div>
  );
};