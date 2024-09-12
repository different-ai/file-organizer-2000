import * as React from "react";
import { Notice, TFile, WorkspaceLeaf } from "obsidian";
import FileOrganizer, { validMediaExtensions } from "../../index";

import { SectionHeader } from "./components/section-header";
import { SimilarTags } from "./components/similar-tags";
import { DocumentChunks } from "./components/document-chunks";
import { RenameSuggestion } from "./components/rename-suggestion";
import { SimilarFolderBox } from "./components/similar-folder-box";
import { RefreshButton } from "./components/refresh-button";
import { ClassificationBox } from "./components/classification-box";
import { TranscriptionButton } from "./components/transcription-button";
import { SimilarFilesBox } from "./components/similar-files-box";
import { EmptyState } from "./components/empty-state";

interface AssistantViewProps {
  plugin: FileOrganizer;
  leaf: WorkspaceLeaf;
}

export const AssistantView: React.FC<AssistantViewProps> = ({
  plugin,
  leaf,
}) => {
  
  const [activeFile, setActiveFile] = React.useState<TFile | null>(null);
  const [noteContent, setNoteContent] = React.useState<string>("");
  const [refreshKey, setRefreshKey] = React.useState<number>(0);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    const updateActiveFile = async () => {
      try {
        const file = plugin.app.workspace.getActiveFile();
        setActiveFile(file);
        if (file) {
          const content = await plugin.app.vault.read(file);
          setNoteContent(content);
        }
      } catch (err) {
        console.error("Error updating active file:", err);
        setError("Failed to load file content");
      }
    };

    updateActiveFile();
    const eventRef = plugin.app.workspace.on("active-leaf-change", updateActiveFile);
    return () => {
      plugin.app.workspace.offref(eventRef);
    };
  }, []);

  const refreshContext = () => {
    setRefreshKey(prevKey => prevKey + 1);
    setError(null);
  };

  const isMediaFile = (file: TFile | null): boolean => {
    if (!file) return false;
    return validMediaExtensions.includes(file.extension);
  };

  if (error) {
    return (
      <EmptyState 
        message={`Error: ${error}. Click refresh to try again.`}
        showRefresh={true}
        onRefresh={refreshContext}
      />
    );
  }

  if (!activeFile) {
    return (
      <EmptyState message="Open a file outside the File Organizer 2000 folder to see AI suggestions" />
    );
  }

  if (isMediaFile(activeFile)) {
    return (
      <EmptyState message="To process an image or audio file, move it to the File Organizer 2000 Inbox Folder (e.g. for image text extraction or audio transcription)." />
    );
  }

  if (!noteContent.trim()) {
    return (
      <EmptyState 
        message="This file is empty. Add some content and click refresh to see AI suggestions."
        showRefresh={true}
        onRefresh={refreshContext}
      />
    );
  }

  const renderSection = (component: React.ReactNode, errorMessage: string) => {
    try {
      return component;
    } catch (err) {
      console.error(errorMessage, err);
      return <div className="section-error">{errorMessage}</div>;
    }
  };

  return (
    <div className="assistant-container">
      <div className="assistant-header">
        <SectionHeader text="Looking at" icon="👀" />
        <div className="active-note-title">{activeFile.basename}</div>
        <RefreshButton onRefresh={refreshContext} />
      </div>

      {renderSection(
        <ClassificationBox
          plugin={plugin}
          file={activeFile}
          content={noteContent}
          refreshKey={refreshKey}
        />,
        "Error loading classification"
      )}

      <SectionHeader text="Tags" icon="🏷️" />
      {renderSection(
        <SimilarTags
          plugin={plugin}
          file={activeFile}
          content={noteContent}
          refreshKey={refreshKey}
        />,
        "Error loading tags"
      )}

      <SectionHeader text="Titles" icon="💡" />
      {renderSection(
        <RenameSuggestion
          plugin={plugin}
          file={activeFile}
          content={noteContent}
          refreshKey={refreshKey}
        />,
        "Error loading title suggestions"
      )}

      <SectionHeader text="Folders" icon="📁" />
      {renderSection(
        <SimilarFolderBox
          plugin={plugin}
          file={activeFile}
          content={noteContent}
          refreshKey={refreshKey}
        />,
        "Error loading folder suggestions"
      )}

      {plugin.settings.enableSimilarFiles && (
        <>
          <SectionHeader text="Similar files" icon="📄" />
          {renderSection(
            <SimilarFilesBox plugin={plugin} file={activeFile} />,
            "Error loading similar files"
          )}
        </>
      )}

      {plugin.settings.enableAtomicNotes && (
        <>
          <SectionHeader text="Atomic notes" icon="✂️" />
          {renderSection(
            <DocumentChunks plugin={plugin} activeFile={activeFile} />,
            "Error loading atomic notes"
          )}
        </>
      )}

      {hasAudioEmbed(noteContent) && (
        <>
          <SectionHeader text="Audio Transcription" icon="🎙️" />
          {renderSection(
            <TranscriptionButton
              plugin={plugin}
              file={activeFile}
              content={noteContent}
            />,
            "Error loading transcription button"
          )}
        </>
      )}
    </div>
  );
};

const hasAudioEmbed = (content: string): boolean => {
  const audioRegex = /!\[\[(.*\.(mp3|wav|m4a|ogg|webm))]]/i;
  return audioRegex.test(content);
};
