import React, { useState } from 'react';
import FileOrganizer from '../../index';
import { FabricPromptManager } from './fabric-prompt-manager';

interface CustomizationTabProps {
  plugin: FileOrganizer;
}

export const CustomizationTab: React.FC<CustomizationTabProps> = ({ plugin }) => {
  const [useLogs, setUseLogs] = useState(plugin.settings.useLogs);
  const [enableFileRenaming, setEnableFileRenaming] = useState(plugin.settings.enableFileRenaming);
  const [renameInstructions, setRenameInstructions] = useState(plugin.settings.renameInstructions);
  const [useSimilarTags, setUseSimilarTags] = useState(plugin.settings.useSimilarTags);
  const [useSimilarTagsInFrontmatter, setUseSimilarTagsInFrontmatter] = useState(plugin.settings.useSimilarTagsInFrontmatter);
  const [processedTag, setProcessedTag] = useState(plugin.settings.processedTag);
  const [enableFabric, setEnableFabric] = useState(plugin.settings.enableFabric);
  const [useFolderEmbeddings, setUseFolderEmbeddings] = useState(plugin.settings.useFolderEmbeddings);
  const [enableAliasGeneration, setEnableAliasGeneration] = useState(plugin.settings.enableAliasGeneration);
  const [enableSimilarFiles, setEnableSimilarFiles] = useState(plugin.settings.enableSimilarFiles);
  const [enableAtomicNotes, setEnableAtomicNotes] = useState(plugin.settings.enableAtomicNotes);
  const [enableScreenpipe, setEnableScreenpipe] = useState(plugin.settings.enableScreenpipe);
  const [useVaultTitles, setUseVaultTitles] = useState(plugin.settings.useVaultTitles);
  const [enableCustomFolderInstructions, setEnableCustomFolderInstructions] = useState(plugin.settings.enableCustomFolderInstructions);
  const [customFolderInstructions, setCustomFolderInstructions] = useState(plugin.settings.customFolderInstructions);
  const [enableDocumentClassification, setEnableDocumentClassification] = useState(plugin.settings.enableDocumentClassification);
  const [showLocalChatModel, setShowLocalChatModels] = useState(plugin.settings.showLocalLLMInChat);

  const handleToggleChange = async (value: boolean, setter: React.Dispatch<React.SetStateAction<boolean>>, settingKey: keyof typeof plugin.settings) => {
    setter(value);
    (plugin.settings[settingKey] as boolean) = value;
    await plugin.saveSettings();
  };

  const handleTextChange = async (value: string, setter: React.Dispatch<React.SetStateAction<string>>, settingKey: keyof typeof plugin.settings) => {
    setter(value);
    (plugin.settings[settingKey] as string) = value;
    await plugin.saveSettings();
  };

  return (
    <div className="p-4 space-y-4">
      <ToggleSetting
        name="FileOrganizer logs"
        description="Allows you to keep track of the changes made by file Organizer."
        value={useLogs}
        onChange={(value) => handleToggleChange(value, setUseLogs, 'useLogs')}
      />

      <ToggleSetting
        name="File Renaming"
        description="Enable file renaming when a file goes through the inbox."
        value={enableFileRenaming}
        onChange={(value) => handleToggleChange(value, setEnableFileRenaming, 'enableFileRenaming')}
      />

      <TextAreaSetting
        name="Rename Instructions"
        description="Provide instructions for renaming the document based on its content."
        value={renameInstructions}
        onChange={(value) => handleTextChange(value, setRenameInstructions, 'renameInstructions')}
      />

      <ToggleSetting
        name="Similar tags"
        description="Append similar tags to processed files."
        value={useSimilarTags}
        onChange={(value) => handleToggleChange(value, setUseSimilarTags, 'useSimilarTags')}
      />

      <ToggleSetting
        name="Add similar tags in frontmatter"
        description="Use frontmatter to add similar tags to processed files."
        value={useSimilarTagsInFrontmatter}
        onChange={(value) => handleToggleChange(value, setUseSimilarTagsInFrontmatter, 'useSimilarTagsInFrontmatter')}
      />

      <ToggleSetting
        name="Processed File Tag"
        description="Specify the tag to be added to processed files."
        value={processedTag}
        onChange={(value) => handleToggleChange(value, setProcessedTag, 'processedTag')}
      />

      <h3 className="text-lg font-semibold mt-6 mb-2">Experimental features</h3>

      <ToggleSetting
        name="Enable Fabric-like Formatting"
        description="Use Fabric-like prompt structure for document formatting."
        value={enableFabric}
        onChange={(value) => handleToggleChange(value, setEnableFabric, 'enableFabric')}
      />

      <ToggleSetting
        name="Use Folder Embeddings"
        description="Enable the use of folder embeddings for improving folder suggestions."
        value={useFolderEmbeddings}
        onChange={(value) => handleToggleChange(value, setUseFolderEmbeddings, 'useFolderEmbeddings')}
      />

      <ToggleSetting
        name="Alias Generation"
        description="Enable the generation of aliases in the assistant sidebar."
        value={enableAliasGeneration}
        onChange={(value) => handleToggleChange(value, setEnableAliasGeneration, 'enableAliasGeneration')}
      />

      <ToggleSetting
        name="Similar Files"
        description="Enable the display of similar files in the assistant sidebar."
        value={enableSimilarFiles}
        onChange={(value) => handleToggleChange(value, setEnableSimilarFiles, 'enableSimilarFiles')}
      />

      <ToggleSetting
        name="Atomic Notes"
        description="Enable the generation of atomic notes in the assistant sidebar."
        value={enableAtomicNotes}
        onChange={(value) => handleToggleChange(value, setEnableAtomicNotes, 'enableAtomicNotes')}
      />

      <ToggleSetting
        name="Screenpipe Integration"
        description="Enable Screenpipe integration for productivity analysis and meeting summaries."
        value={enableScreenpipe}
        onChange={(value) => handleToggleChange(value, setEnableScreenpipe, 'enableScreenpipe')}
      />

      <ToggleSetting
        name="Personalized Titles"
        description="Use random titles from your vault to improve AI-generated titles. This feature feeds 20 random vault titles to the AI for better context."
        value={useVaultTitles}
        onChange={(value) => handleToggleChange(value, setUseVaultTitles, 'useVaultTitles')}
      />

      <ToggleSetting
        name="Enable Custom Logic for Folder Determination"
        description="Use instructions below to determine folder placement for notes processed through the inbox."
        value={enableCustomFolderInstructions}
        onChange={(value) => handleToggleChange(value, setEnableCustomFolderInstructions, 'enableCustomFolderInstructions')}
      />

      <TextAreaSetting
        name="Custom Folder Determination Instructions"
        description="Provide custom instructions for determining which folders to place your notes in."
        value={customFolderInstructions}
        onChange={(value) => handleTextChange(value, setCustomFolderInstructions, 'customFolderInstructions')}
        disabled={!enableCustomFolderInstructions}
      />

      <h3 className="text-lg font-semibold mt-6 mb-2">Custom Formatting</h3>

      <ToggleSetting
        name="Document Auto-Formatting"
        description="Automatically format documents processed through the inbox when content matches a category of your AI templates."
        value={enableDocumentClassification}
        onChange={(value) => handleToggleChange(value, setEnableDocumentClassification, 'enableDocumentClassification')}
      />

      <div className="setting-item">
        <div className="setting-item-info">
          <div className="setting-item-name">Document Type Configuration</div>
          <div className="setting-item-description">
            To specify the document type for AI formatting, please add a file inside the template folder of File Organizer. Each file should be named according to the document type it represents (e.g., 'workout'). The content of each file should be the prompt that will be applied to the formatting. Additionally, you can access and manage these document types directly through the AI sidebar in the application.
          </div>
        </div>
      </div>

      <ToggleSetting
        name="Enable Fabric-like Formatting"
        description="Use Fabric-like prompt structure for document formatting."
        value={enableFabric}
        onChange={(value) => handleToggleChange(value, setEnableFabric, 'enableFabric')}
      />

      <ToggleSetting
        name="Use Local Chat"
        description="Toggle to use local chat instead of server-based chat"
        value={showLocalChatModel}
        onChange={(value) => handleToggleChange(value, setShowLocalChatModels, 'showLocalLLMInChat')}
      />

      {enableFabric && (
        <FabricPromptManager plugin={plugin} />
      )}
    </div>
  );
};

interface ToggleSettingProps {
  name: string;
  description: string;
  value: boolean;
  onChange: (value: boolean) => void;
}

const ToggleSetting: React.FC<ToggleSettingProps> = ({ name, description, value, onChange }) => (
  <div className="flex items-center justify-between py-2">
    <div>
      <div className="font-medium text-[--text-normal]">{name}</div>
      <div className="text-sm text-[--text-muted]">{description}</div>
    </div>
    <div>
      <input
        type="checkbox"
        checked={value}
        onChange={(e) => onChange(e.target.checked)}
        className="form-checkbox h-5 w-5 text-[--interactive-accent]"
      />
    </div>
  </div>
);

interface TextAreaSettingProps {
  name: string;
  description: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

const TextAreaSetting: React.FC<TextAreaSettingProps> = ({ name, description, value, onChange, disabled }) => (
  <div className="py-2">
    <div className="font-medium text-[--text-normal]">{name}</div>
    <div className="text-sm text-[--text-muted] mb-1">{description}</div>
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      className="w-full px-3 py-2 text-[--text-normal] bg-[--background-primary] border border-[--background-modifier-border] rounded-lg focus:outline-none focus:border-[--interactive-accent] disabled:bg-[--background-secondary]"
      rows={4}
    />
  </div>
);
