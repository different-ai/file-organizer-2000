import React, { useState } from 'react';
import FileOrganizer from '../../index';
import { FabricPromptManager } from './fabric-prompt-manager';

interface ExperimentTabProps {
  plugin: FileOrganizer;
}

export const ExperimentTab: React.FC<ExperimentTabProps> = ({ plugin }) => {
  const [enableSimilarFiles, setEnableSimilarFiles] = useState(plugin.settings.enableSimilarFiles);
  const [enableAtomicNotes, setEnableAtomicNotes] = useState(plugin.settings.enableAtomicNotes);
  const [enableScreenpipe, setEnableScreenpipe] = useState(plugin.settings.enableScreenpipe);
  const [enableFabric, setEnableFabric] = useState(plugin.settings.enableFabric);
  const [useInbox, setUseInbox] = useState(plugin.settings.useInbox);
  const [showLocalLLMInChat, setShowLocalLLMInChat] = useState(plugin.settings.showLocalLLMInChat);

  const handleToggleChange = async (value: boolean, setter: React.Dispatch<React.SetStateAction<boolean>>, settingKey: keyof typeof plugin.settings) => {
    setter(value);
    (plugin.settings[settingKey] as boolean) = value;
    await plugin.saveSettings();
  };

  return (
    <div className="experiment-settings p-4 space-y-8">
      <div className="mb-8">
        <p className="text-[--text-muted] mb-4">
          These experimental features enhance your File Organizer experience. Enable them to:
        </p>
        <ul className="list-disc pl-6 text-[--text-muted] space-y-1 mb-6">
          <li>Discover similar files automatically</li>
          <li>Generate atomic notes from your content</li>
          <li>Integrate with external tools</li>
          <li>Use AI-powered formatting</li>
        </ul>
        <div className="p-4 bg-[--background-primary-alt] rounded-lg border border-[--background-modifier-border]">
          <p className="text-sm text-[--text-accent]">
            💡 Tip: Start with one experimental feature at a time to better understand its impact on your workflow.
          </p>
        </div>
      </div>

      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-medium text-[--text-normal] mb-4">Core Experiments</h3>
          <div className="space-y-3">
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
              name="Batch Inbox Processing (Beta)"
              description={
                <div className="space-y-2">
                  <p>Enable the new inbox system designed for processing large volumes of files efficiently.</p>
                  <div className="mt-2 p-3 bg-[--background-secondary] rounded text-sm space-y-1">
                    <p className="text-[--text-accent]">✨ New Features:</p>
                    <ul className="list-disc pl-4 text-[--text-muted]">
                      <li>Real-time processing status in sidebar</li>
                      <li>Improved batch file handling</li>
                      <li>Progress logging and monitoring</li>
                    </ul>
                    <p className="text-[--text-warning] mt-2">Note: Currently does not support classifications and tagging</p>
                  </div>
                </div>
              }
              value={useInbox}
              onChange={(value) => handleToggleChange(value, setUseInbox, 'useInbox')}
            />
            <ToggleSetting
              name="Local LLM Integration"
              description={
                <div className="space-y-2">
                  <p>Enable local LLM options in the chat interface for offline AI processing.</p>
                  <div className="mt-2 p-3 bg-[--background-secondary] rounded text-sm space-y-2">
                    <p className="text-[--text-warning]">⚡ Requires a compatible local LLM setup</p>
                    <p className="text-[--text-muted]">Currently supports:</p>
                    <ul className="list-disc pl-4 text-[--text-muted]">
                      <li>Llama 3.2</li>
                      <li>Ollama</li>
                    </ul>
                    <p className="text-xs text-[--text-faint]">More models coming soon</p>
                  </div>
                </div>
              }
              value={showLocalLLMInChat}
              onChange={(value) => handleToggleChange(value, setShowLocalLLMInChat, 'showLocalLLMInChat')}
            />
          </div>
        </div>

        <div className="border-t border-[--background-modifier-border] pt-6">
          <h3 className="text-lg font-medium text-[--text-normal] mb-4">Integrations (Beta)</h3>
          <div className="bg-[--background-secondary] p-4 rounded-lg mb-4">
            <p className="text-sm text-[--text-muted]">
              These integrations are in early beta. Your feedback helps us improve and prioritize features.
            </p>
          </div>
          
          <div className="space-y-3">
            <ToggleSetting
              name="Screenpipe Integration"
              description="Enable Screenpipe integration for productivity analysis and meeting summaries."
              value={enableScreenpipe}
              onChange={(value) => handleToggleChange(value, setEnableScreenpipe, 'enableScreenpipe')}
            />

            <div className="space-y-3">
              <ToggleSetting
                name="Enable Fabric-like Formatting"
                description="Use Fabric-like prompt structure for document formatting."
                value={enableFabric}
                onChange={(value) => handleToggleChange(value, setEnableFabric, 'enableFabric')}
              />
              {enableFabric && (
                <div className="ml-4 p-4 bg-[--background-primary-alt] rounded-lg border-l-2 border-[--text-accent]">
                  <FabricPromptManager plugin={plugin} />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

interface ToggleSettingProps {
  name: string;
  description: string | JSX.Element;
  value: boolean;
  onChange: (value: boolean) => void;
}

const ToggleSetting: React.FC<ToggleSettingProps> = ({ name, description, value, onChange }) => (
  <div className="setting-item flex items-center justify-between p-4 bg-[--background-primary] rounded-lg border border-[--background-modifier-border] hover:border-[--background-modifier-border-hover]">
    <div className="setting-item-info flex-1">
      <div className="setting-item-name font-medium text-[--text-normal]">{name}</div>
      <div className="setting-item-description text-sm text-[--text-muted]">
        {description}
      </div>
    </div>
    <div className="setting-item-control">
      <input
        type="checkbox"
        checked={value}
        onChange={(e) => onChange(e.target.checked)}
        className="text-[--interactive-accent] rounded border-[--background-modifier-border]"
      />
    </div>
  </div>
); 