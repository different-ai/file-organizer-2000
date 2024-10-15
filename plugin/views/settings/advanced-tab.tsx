import React, { useState } from 'react';
import FileOrganizer from '../../index';

interface AdvancedTabProps {
  plugin: FileOrganizer;
}

export const AdvancedTab: React.FC<AdvancedTabProps> = ({ plugin }) => {
  const [enableSelfHosting, setEnableSelfHosting] = useState(plugin.settings.enableSelfHosting);
  const [selfHostingURL, setSelfHostingURL] = useState(plugin.settings.selfHostingURL);

  const handleToggleChange = async (value: boolean) => {
    setEnableSelfHosting(value);
    plugin.settings.enableSelfHosting = value;
    await plugin.saveSettings();
  };

  const handleURLChange = async (value: string) => {
    setSelfHostingURL(value);
    plugin.settings.selfHostingURL = value;
    await plugin.saveSettings();
  };

  return (
    <div className="advanced-settings">
      <div className="setting-item">
        <div className="setting-item-info">
          <div className="setting-item-name">Enable Self-Hosting</div>
          <div className="setting-item-description">
            Enable Self-Hosting to host the server on your own machine. Requires technical skills and an external OpenAI API Key + credits. Keep disabled for default version of the plugin.
          </div>
        </div>
        <div className="setting-item-control">
          <input
            type="checkbox"
            checked={enableSelfHosting}
            onChange={(e) => handleToggleChange(e.target.checked)}
          />
        </div>
      </div>

      {enableSelfHosting && (
        <div className="setting-item">
          <div className="setting-item-info">
            <div className="setting-item-name">Server URL</div>
          </div>
          <div className="setting-item-control">
            <input
              type="text"
              placeholder="Enter your Server URL"
              value={selfHostingURL}
              onChange={(e) => handleURLChange(e.target.value)}
            />
          </div>
        </div>
      )}
    </div>
  );
};
