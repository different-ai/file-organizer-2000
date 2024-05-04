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

const SuggestionBox: React.FC<{
  plugin: FileOrganizer;
  file: TFile | null;
  content: string;
}> = ({ plugin, file, content }) => {
  const [suggestions, setSuggestions] = React.useState<string[] | null>(null);
  const [loading, setLoading] = React.useState<boolean>(false);

  React.useEffect(() => {
    const suggestTags = async () => {
      if (!file || !content) return;
      setLoading(true);
      const tags = await plugin.getSimilarTags(content, file.basename);
      setSuggestions(tags);
      setLoading(false);
    };
    suggestTags();
  }, [file, content]);

  if (loading) return <div>Loading...</div>;
  if (!suggestions) return null;

  return (
    <div className="assistant-section tags-section">
      <SectionHeader text="Similar tags" icon="🏷️" />
      <div className="tags-container">
        {suggestions.map((tag, index) => (
          <span
            key={index}
            className="tag"
            onClick={() => plugin.appendTag(file!, tag)}
          >
            {tag}
          </span>
        ))}
      </div>
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
      setLoading(true);
      const suggestedAlias = await plugin.generateNameFromContent(content);
      setAlias(suggestedAlias);
      setLoading(false);
    };
    suggestAlias();
  }, [file, content]);

  if (loading) return <div>Loading...</div>;
  if (!alias) return null;

  return (
    <div className="assistant-section alias-section">
      <SectionHeader text="Suggested alias" icon="💡" />
      <div className="alias-container">
        <span className="alias">{alias}</span>
        <button
          className="add-alias-button"
          onClick={() =>
            plugin.appendToFrontMatter(file!, "alias", alias)
          }
        >
          Add
        </button>
      </div>
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
      setLoading(true);
      const suggestedFolder = await plugin.getAIClassifiedFolder(
        content,
        file
      );
      setFolder(suggestedFolder);
      setLoading(false);
    };
    suggestFolder();
  }, [file, content]);

  if (loading) return <div>Loading...</div>;
  if (!folder) return null;

  return (
    <div className="assistant-section folder-section">
      <SectionHeader text="Suggested folder" icon="📁" />
      <div className="folder-container">
        <span className="folder">{folder}</span>
        <button
          className="move-note-button"
          onClick={() =>
            plugin.moveContent(file!, file!.basename, folder)
          }
        >
          Move
        </button>
      </div>
    </div>
  );
};

const SimilarFilesBox: React.FC<{
  plugin: FileOrganizer;
  file: TFile | null;
}> = ({ plugin, file }) => {
  const [files, setFiles] = React.useState<string[] | null>(null);
  const [loading, setLoading] = React.useState<boolean>(false);

  React.useEffect(() => {
    const fetchSimilarFiles = async () => {
      if (!file) return;
      setLoading(true);
      const similarFiles = await plugin.getSimilarFiles(file);
      setFiles(similarFiles);
      setLoading(false);
    };
    fetchSimilarFiles();
  }, [file]);

  if (loading) return <div>Loading...</div>;
  if (!files) return null;

  return (
    <div className="assistant-section files-section">
      <SectionHeader text="Similar files" icon="📄" />
      <div className="files-container">
        {files.map((file, index) => (
          <div key={index} className="file">
            <a
              href="#"
              onClick={() => {
                const path =
                  plugin.app.metadataCache.getFirstLinkpathDest(
                    file,
                    ""
                  );
                plugin.app.workspace.openLinkText(path, "/", false);
              }}
            >
              {file.replace(".md", "")}
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
      setLoading(true);
      const result = await plugin.useCustomClassifier(content, file.basename);
      setClassification(result);
      setLoading(false);
    };
    fetchClassification();
  }, [file, content]);

  if (loading) return <div>Loading...</div>; 
  if (!classification) return null;

  return (
    <div className="assistant-section classification-section">
      <button
        className="format-button"
        disabled={formatting}
        onClick={async () => {
          setFormatting(true);
          await plugin.formatContent(file!, content, classification);
          setFormatting(false);
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
    const onFileOpen = async (file: TFile | null) => {
      if (!file || !file.path) {
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
      const isInSettingsPath = settingsPaths.some((path) => file.path.includes(path));
      if (isInSettingsPath) {
        setActiveFile(null);
        setNoteContent("");
        return;
      }

      setActiveFile(file);
      const content = await plugin.getTextFromFile(file);
      setNoteContent(content);
    };

    const fileOpenEventRef = plugin.app.workspace.on(
      "file-open", 
      onFileOpen
    );
    
    return () => {
      plugin.app.workspace.offref(fileOpenEventRef);
    };
  }, []);
  
  if (!activeFile) {
    return <div className="assistant-placeholder">Open a file to see AI suggestions</div>;
  }

  return (
    <div className="assistant-container">
      <SectionHeader text="Looking at" icon="👀" />
      <div className="active-note-title">{activeFile.basename}</div>
      
      <ClassificationBox
        plugin={plugin}
        file={activeFile}
        content={noteContent}
      />
      <SuggestionBox 
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
    </div>
  );
};