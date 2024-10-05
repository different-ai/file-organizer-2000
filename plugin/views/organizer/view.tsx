import * as React from "react";
import { TFile, WorkspaceLeaf } from "obsidian";
import FileOrganizer, { validMediaExtensions } from "../../index";
import { debounce } from "lodash";

import { SectionHeader } from "./components/section-header";
import { SimilarTags } from "./tags";
import { DocumentChunks } from "./chunks";
import { RenameSuggestion } from "./titles/box";
import { SimilarFolderBox } from "./folders/box";
import { RefreshButton } from "./components/refresh-button";
import { ClassificationContainer } from "./classification";
import { TranscriptionButton } from "./transcript";
import { SimilarFilesBox } from "./files";
import { EmptyState } from "./components/empty-state";
import { logMessage } from "../../../utils";

interface AssistantViewProps {
  plugin: FileOrganizer;
  leaf: WorkspaceLeaf;
}

const checkIfIsMediaFile = (file: TFile | null): boolean => {
  if (!file) return false;
  return validMediaExtensions.includes(file.extension);
};

export const AssistantView: React.FC<AssistantViewProps> = ({
  plugin,
  leaf,
}) => {
  const [activeFile, setActiveFile] = React.useState<TFile | null>(null);
  const [noteContent, setNoteContent] = React.useState<string>("");
  const [refreshKey, setRefreshKey] = React.useState<number>(0);
  const [error, setError] = React.useState<string | null>(null);
  const isMediaFile = React.useMemo(() => checkIfIsMediaFile(activeFile), [activeFile]);

  const updateActiveFile = React.useCallback(async () => {
    logMessage("updating active file");
    // Check if the Assistant view is visible before processing
    const isVisible =
      leaf.view.containerEl.isShown() &&
      !plugin.app.workspace.rightSplit.collapsed;
    if (!isVisible) return;

    try {
      const file = plugin.app.workspace.getActiveFile();
      if (file && !isMediaFile) {
        const content = await plugin.app.vault.read(file);
        setNoteContent(content);
      }
      setActiveFile(file);
    } catch (err) {
      console.error("Error updating active file:", err);
      setError("Failed to load file content");
    }
  }, [
    plugin.app.workspace,
    plugin.app.vault,
    leaf.view.containerEl,
    plugin.app.workspace.rightSplit.collapsed,
    leaf.view.containerEl.isShown,
    isMediaFile,
  ]);

  React.useEffect(() => {
    updateActiveFile();
    const debouncedUpdate = debounce(updateActiveFile, 300);

    // Attach event listeners
    plugin.app.workspace.on("file-open", debouncedUpdate);
    plugin.app.workspace.on("active-leaf-change", debouncedUpdate);

    // Cleanup function to remove event listeners
    return () => {
      plugin.app.workspace.off("file-open", debouncedUpdate);
      plugin.app.workspace.off("active-leaf-change", debouncedUpdate);
      debouncedUpdate.cancel();
    };
  }, [updateActiveFile, plugin.app.workspace]);

  const refreshContext = React.useCallback(() => {
    setRefreshKey(prevKey => prevKey + 1);
    setError(null);
    updateActiveFile();
  }, [updateActiveFile]);

  const renderSection = React.useCallback(
    (component: React.ReactNode, errorMessage: string) => {
      try {
        return component;
      } catch (err) {
        console.error(errorMessage, err);
        return <div className="section-error">{errorMessage}</div>;
      }
    },
    []
  );

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

  if (isMediaFile) {
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

  return (
    <div className="assistant-container">
      <RefreshButton onRefresh={refreshContext} />
      <div className="assistant-header">
        <SectionHeader text="Looking at" />
        <div className="active-note-title">{activeFile.basename}</div>
      </div>

      {renderSection(
        <ClassificationContainer
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
