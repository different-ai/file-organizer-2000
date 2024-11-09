import React, { useState } from 'react';
import FileOrganizer from '../../index';
import { useEffect } from 'react';

interface CustomizationTabProps {
  plugin: FileOrganizer;
}

export const CustomizationTab: React.FC<CustomizationTabProps> = ({ plugin }) => {
  const [enableFileRenaming, setEnableFileRenaming] = useState(plugin.settings.enableFileRenaming);
  const [renameInstructions, setRenameInstructions] = useState(plugin.settings.renameInstructions);
  const [useSimilarTags, setUseSimilarTags] = useState(plugin.settings.useSimilarTags);
  const [useSimilarTagsInFrontmatter, setUseSimilarTagsInFrontmatter] = useState(plugin.settings.useSimilarTagsInFrontmatter);
  const [useVaultTitles, setUseVaultTitles] = useState(plugin.settings.useVaultTitles);
  const [customFolderInstructions, setCustomFolderInstructions] = useState(plugin.settings.customFolderInstructions);
  const [enableDocumentClassification, setEnableDocumentClassification] = useState(plugin.settings.enableDocumentClassification);
  const [imageInstructions, setImageInstructions] = useState(plugin.settings.imageInstructions);

  // force set user embeddings to false
  useEffect(() => {
    plugin.settings.useFolderEmbeddings = false;
    plugin.saveSettings();
  }, [plugin.settings]);

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
    <div className="p-4 space-y-8">
      {/* Renaming Section */}
      <section>
        <h3 className="text-lg font-semibold mb-4 text-[--text-normal]">File Renaming</h3>
        <div className="space-y-4">
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
            name="Personalized Titles"
            description="Use random titles from your vault to improve AI-generated titles. This feature feeds 20 random vault titles to the AI for better context."
            value={useVaultTitles}
            onChange={(value) => handleToggleChange(value, setUseVaultTitles, 'useVaultTitles')}
          />
        </div>
      </section>

      {/* Tags Section */}
      <section>
        <h3 className="text-lg font-semibold mb-4 text-[--text-normal]">Tags Management</h3>
        <div className="space-y-4">
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
        </div>
      </section>

      {/* Folder Section */}
      <section>
        <h3 className="text-lg font-semibold mb-4 text-[--text-normal]">Folder Organization</h3>
        <div className="space-y-4">
          <TextAreaSetting
            name="Custom Folder Determination Instructions"
            description="Provide custom instructions for determining which folders to place your notes in."
            value={customFolderInstructions}
            onChange={(value) => handleTextChange(value, setCustomFolderInstructions, 'customFolderInstructions')}
          />
        </div>
      </section>

      {/* Formatting Section */}
      <section>
        <h3 className="text-lg font-semibold mb-4 text-[--text-normal]">Document Formatting</h3>
        <div className="space-y-4">
          <ToggleSetting
            name="Document Auto-Formatting"
            description="Automatically format documents processed through the inbox when content matches a category of your AI templates."
            value={enableDocumentClassification}
            onChange={(value) => handleToggleChange(value, setEnableDocumentClassification, 'enableDocumentClassification')}
          />
          <div className="bg-[--background-secondary] p-4 rounded-lg">
            <div className="font-medium text-[--text-normal] mb-2">Document Type Configuration</div>
            <div className="text-sm text-[--text-muted]">
              To specify the document type for AI formatting, please add a file inside the template folder of File Organizer. 
              Each file should be named according to the document type it represents (e.g., 'workout'). 
              The content of each file should be the prompt that will be applied to the formatting. 
              Additionally, you can access and manage these document types directly through the AI sidebar in the application.
            </div>
          </div>
        </div>
      </section>

      {/* Image Processing Section */}
      <section>
        <h3 className="text-lg font-semibold mb-4 text-[--text-normal]">Image Processing</h3>
        <div className="space-y-4">
          <TextAreaSetting
            name="Image Instructions"
            description="Provide instructions for how to process and describe images in your documents."
            value={imageInstructions}
            onChange={(value) => handleTextChange(value, setImageInstructions, 'imageInstructions')}
          />
          <div className="bg-[--background-secondary] p-4 rounded-lg">
            <div className="text-sm text-[--text-muted]">
              These instructions will be used to generate descriptions for images in your documents. 
              The AI will analyze the image content and create descriptions based on your specifications.
            </div>
          </div>
        </div>
      </section>
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
        className="form-checkbox text-[--interactive-accent]"
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
