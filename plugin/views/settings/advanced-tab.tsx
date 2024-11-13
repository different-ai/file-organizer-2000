import React, { useState } from 'react';
import FileOrganizer from '../../index';
import { logger } from '../../services/logger';

interface AdvancedTabProps {
  plugin: FileOrganizer;
}

export const AdvancedTab: React.FC<AdvancedTabProps> = ({ plugin }) => {
  const [enableSelfHosting, setEnableSelfHosting] = useState(plugin.settings.enableSelfHosting);
  const [selfHostingURL, setSelfHostingURL] = useState(plugin.settings.selfHostingURL);
  const [useLogs, setUseLogs] = useState(plugin.settings.useLogs);
  const [debugMode, setDebugMode] = useState(plugin.settings.debugMode);
  const [showLogs, setShowLogs] = useState(false);
  const [contentCutoffChars, setContentCutoffChars] = useState(plugin.settings.contentCutoffChars);
  const [maxFormattingTokens, setMaxFormattingTokens] = useState(plugin.settings.maxFormattingTokens);

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

  const handleExportLogs = () => {
    const csv = logger.exportToCSV();
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `file-organizer-logs-${new Date().toISOString()}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="p-4 space-y-4">
      <ToggleSetting
        name="Fo2k File Logs"
        description="Allows you to keep track of the changes made by file Organizer."
        value={useLogs}
        onChange={(value) => {
          setUseLogs(value);
          plugin.settings.useLogs = value;
          plugin.saveSettings();
        }}
      />

      <ToggleSetting
        name="Debug Mode"
        description="Enable detailed logging for troubleshooting. This may impact performance."
        value={debugMode}
        onChange={(value) => {
          setDebugMode(value);
          logger.configure(value);
          plugin.settings.debugMode = value;
          plugin.saveSettings();
        }}
      />

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

      {useLogs && (
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <button
              className="bg-[--interactive-accent] text-[--text-on-accent] px-3 py-1 rounded"
              onClick={() => setShowLogs(!showLogs)}
            >
              {showLogs ? 'Hide Debug Data' : 'Show Debug Data'}
            </button>
            <button
              className="bg-[--interactive-accent] text-[--text-on-accent] px-3 py-1 rounded"
              onClick={handleExportLogs}
            >
              Export Debug Data
            </button>
          </div>

          {showLogs && (
            <div className="max-h-96 overflow-y-auto border border-[--background-modifier-border] rounded p-2">
              {logger.getLogs().map((log, index) => (
                <div 
                  key={index}
                  className={`py-1 ${
                    log.level === 'error' ? 'text-[--text-error]' :
                    log.level === 'warn' ? 'text-[--text-warning]' :
                    'text-[--text-normal]'
                  }`}
                >
                  <span className="text-[--text-muted] text-xs">
                    {new Date(log.timestamp).toLocaleString()}
                  </span>
                  {' '}
                  <span className="font-medium">[{log.level.toUpperCase()}]</span>
                  {' '}
                  {log.message}
                  {log.details && (
                    <pre className="text-xs mt-1 text-[--text-muted]">
                      {log.details}
                    </pre>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="setting-item">
        <div className="setting-item-info">
          <div className="setting-item-name">Content Analysis Cutoff</div>
          <div className="setting-item-description">
            Maximum number of characters to analyze for folder suggestions, tagging, and titles. 
            Lower values improve performance and reduce API costs. Default: 1000
          </div>
        </div>
        <div className="setting-item-control">
          <input
            type="number"
            min="100"
            max="10000"
            value={contentCutoffChars}
            onChange={(e) => {
              const value = parseInt(e.target.value);
              setContentCutoffChars(value);
              plugin.settings.contentCutoffChars = value;
              plugin.saveSettings();
            }}
            className="w-24"
          />
        </div>
      </div>

      <div className="setting-item">
        <div className="setting-item-info">
          <div className="setting-item-name">Max Formatting Tokens</div>
          <div className="setting-item-description">
            Maximum number of tokens allowed for document formatting in the inbox. 
            Documents exceeding this limit will be skipped. Default: 100,000
          </div>
        </div>
        <div className="setting-item-control">
          <input
            type="number"
            min="1000"
            max="500000"
            step="1000"
            value={maxFormattingTokens}
            onChange={(e) => {
              const value = parseInt(e.target.value);
              setMaxFormattingTokens(value);
              plugin.settings.maxFormattingTokens = value;
              plugin.saveSettings();
            }}
            className="w-24"
          />
        </div>
      </div>
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
