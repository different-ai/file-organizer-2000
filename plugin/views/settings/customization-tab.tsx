import React, { useState, useEffect } from 'react';
import type FileOrganizer from '../../index';

interface CustomizationTabProps {
  plugin: InstanceType<typeof FileOrganizer>;
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
  const [customTagInstructions, setCustomTagInstructions] = useState(plugin.settings.customTagInstructions);

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
      {/* Inbox Processing Section */}
      <section>
        <h3 className="text-lg font-semibold mb-4 text-[--text-normal]">Inbox Processing</h3>
        <div className="bg-[--background-secondary] p-4 rounded-lg mb-4">
          <div className="text-sm text-[--text-muted]">
            These settings control how new files are automatically handled when they enter your vault through the inbox. 
            Enable or disable automatic processing features and configure how the AI should handle your incoming documents.
          </div>
        </div>
        <div className="space-y-4">
          <ToggleSetting
            name="Inbox Auto-Renaming"
            description="Automatically rename new files when they are processed through the inbox."
            value={enableFileRenaming}
            onChange={(value) => handleToggleChange(value, setEnableFileRenaming, 'enableFileRenaming')}
          />
          <ToggleSetting
            name="Inbox Auto-Formatting"
            description="Automatically format new documents when they match a template category during inbox processing."
            value={enableDocumentClassification}
            onChange={(value) => handleToggleChange(value, setEnableDocumentClassification, 'enableDocumentClassification')}
          />
          <div className="bg-[--background-secondary] p-4 rounded-lg mt-2">
            <div className="font-medium text-[--text-normal] mb-2">Document Type Templates</div>
            <div className="text-sm text-[--text-muted]">
              To enable auto-formatting, create template files in the File Organizer template folder. 
              Name each file according to its document type (e.g., 'workout.md', 'meeting-notes.md'). 
              The content of each file should contain the formatting instructions.
              You can manage these templates through the AI sidebar.
            </div>
          </div>
          <ToggleSetting
            name="Inbox Similar Tags"
            description="Automatically append similar tags to new files during inbox processing."
            value={useSimilarTags}
            onChange={(value) => handleToggleChange(value, setUseSimilarTags, 'useSimilarTags')}
          />
        </div>
      </section>

      {/* General Settings Section */}
      <section>
        <h3 className="text-lg font-semibold mb-4 text-[--text-normal]">General Settings</h3>
        <div className="bg-[--background-secondary] p-4 rounded-lg mb-4">
          <div className="text-sm text-[--text-muted]">
            Configure how File Organizer behaves across your vault. These settings affect both manual operations 
            and provide the base configuration for inbox processing. Customize naming conventions, tagging behavior, 
            and folder organization to match your workflow.
          </div>
        </div>
        
        {/* File Naming subsection */}
        <div className="mb-6">
          <h4 className="font-medium text-[--text-normal] mb-2">File Naming</h4>
          <div className="space-y-4">
            <TextAreaSetting
              name="Rename Instructions"
              description="Instructions for how files should be renamed based on their content."
              value={renameInstructions}
              onChange={(value) => handleTextChange(value, setRenameInstructions, 'renameInstructions')}
            />
            <ToggleSetting
              name="Use Vault Context"
              description="Improve AI-generated titles by providing examples from your vault (uses 20 random titles)."
              value={useVaultTitles}
              onChange={(value) => handleToggleChange(value, setUseVaultTitles, 'useVaultTitles')}
            />
          </div>
        </div>

        {/* Tags subsection */}
        <div className="mb-6">
          <h4 className="font-medium text-[--text-normal] mb-2">Tags</h4>
          <div className="space-y-4">
            <ToggleSetting
              name="Use Frontmatter"
              description="Add similar tags in frontmatter instead of inline."
              value={useSimilarTagsInFrontmatter}
              onChange={(value) => handleToggleChange(value, setUseSimilarTagsInFrontmatter, 'useSimilarTagsInFrontmatter')}
            />
            <TextAreaSetting
              name="Tag Generation Instructions"
              description="Custom instructions for generating tags for your notes."
              value={customTagInstructions}
              onChange={(value) => handleTextChange(value, setCustomTagInstructions, 'customTagInstructions')}
            />
          </div>
        </div>

        {/* Folder Section */}
        <div className="mb-6">
          <h4 className="font-medium text-[--text-normal] mb-2">Folder Organization</h4>
          <div className="space-y-4">
            <TextAreaSetting
              name="Custom Folder Determination Instructions"
              description="Provide custom instructions for determining which folders to place your notes in."
              value={customFolderInstructions}
              onChange={(value) => handleTextChange(value, setCustomFolderInstructions, 'customFolderInstructions')}
            />
          </div>
        </div>

        {/* Image Processing Section */}
        <div className="mb-6">
          <h4 className="font-medium text-[--text-normal] mb-2">Image Processing</h4>
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
