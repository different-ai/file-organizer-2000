import React, { useState } from 'react';
import FileOrganizer from '../../index';
import { cleanPath } from '../../../utils';

interface FileConfigTabProps {
  plugin: FileOrganizer;
}

export const FileConfigTab: React.FC<FileConfigTabProps> = ({ plugin }) => {
  const [pathToWatch, setPathToWatch] = useState(plugin.settings.pathToWatch);
  const [attachmentsPath, setAttachmentsPath] = useState(plugin.settings.attachmentsPath);
  const [logFolderPath, setLogFolderPath] = useState(plugin.settings.logFolderPath);
  const [defaultDestinationPath, setDefaultDestinationPath] = useState(plugin.settings.defaultDestinationPath);
  const [ignoreFolders, setIgnoreFolders] = useState(plugin.settings.ignoreFolders.join(','));
  const [backupFolderPath, setBackupFolderPath] = useState(plugin.settings.backupFolderPath);
  const [templatePaths, setTemplatePaths] = useState(plugin.settings.templatePaths);

  const handleSettingChange = async (
    value: string,
    setter: React.Dispatch<React.SetStateAction<string>>,
    settingKey: keyof typeof plugin.settings
  ) => {
    const cleanedValue = cleanPath(value);
    setter(cleanedValue);
    plugin.settings[settingKey] = cleanedValue;
    await plugin.saveSettings();
  };

  const handleIgnoreFoldersChange = async (value: string) => {
    setIgnoreFolders(value);
    const trimmedValue = value.trim();
    if (trimmedValue === "*") {
      plugin.settings.ignoreFolders = ["*"];
    } else {
      plugin.settings.ignoreFolders = trimmedValue.split(",").map(cleanPath);
    }
    await plugin.saveSettings();
  };

  return (
    <div className="file-config-settings">
      <div className="setting-item">
        <div className="setting-item-info">
          <div className="setting-item-name">Inbox folder</div>
          <div className="setting-item-description">Choose which folder to automatically organize files from</div>
        </div>
        <div className="setting-item-control">
          <input
            type="text"
            placeholder="Enter your path"
            value={pathToWatch}
            onChange={(e) => handleSettingChange(e.target.value, setPathToWatch, 'pathToWatch')}
          />
        </div>
      </div>

      <div className="setting-item">
        <div className="setting-item-info">
          <div className="setting-item-name">Attachments folder</div>
          <div className="setting-item-description">Enter the path to the folder where the original images will be moved.</div>
        </div>
        <div className="setting-item-control">
          <input
            type="text"
            placeholder="Enter your path"
            value={attachmentsPath}
            onChange={(e) => handleSettingChange(e.target.value, setAttachmentsPath, 'attachmentsPath')}
          />
        </div>
      </div>

      <div className="setting-item">
        <div className="setting-item-info">
          <div className="setting-item-name">File Organizer log folder</div>
          <div className="setting-item-description">Choose a folder for Organization Logs e.g. Ava/Logs.</div>
        </div>
        <div className="setting-item-control">
          <input
            type="text"
            placeholder="Enter your path"
            value={logFolderPath}
            onChange={(e) => handleSettingChange(e.target.value, setLogFolderPath, 'logFolderPath')}
          />
        </div>
      </div>

      <div className="setting-item">
        <div className="setting-item-info">
          <div className="setting-item-name">Output folder path</div>
          <div className="setting-item-description">Enter the path where you want to save the processed files. e.g. Processed/myfavoritefolder</div>
        </div>
        <div className="setting-item-control">
          <input
            type="text"
            placeholder="Enter your path"
            value={defaultDestinationPath}
            onChange={(e) => handleSettingChange(e.target.value, setDefaultDestinationPath, 'defaultDestinationPath')}
          />
        </div>
      </div>

      <div className="setting-item">
        <div className="setting-item-info">
          <div className="setting-item-name">Ignore folders</div>
          <div className="setting-item-description">Enter folder paths to ignore during organization, separated by commas(e.g. Folder1,Folder2). Or * to ignore all folders</div>
        </div>
        <div className="setting-item-control">
          <input
            type="text"
            placeholder="Enter folder paths or *"
            value={ignoreFolders}
            onChange={(e) => handleIgnoreFoldersChange(e.target.value)}
          />
        </div>
      </div>

      <div className="setting-item">
        <div className="setting-item-info">
          <div className="setting-item-name">Backup folder</div>
          <div className="setting-item-description">Choose a folder for file backups.</div>
        </div>
        <div className="setting-item-control">
          <input
            type="text"
            placeholder="Enter your path"
            value={backupFolderPath}
            onChange={(e) => handleSettingChange(e.target.value, setBackupFolderPath, 'backupFolderPath')}
          />
        </div>
      </div>

      <div className="setting-item">
        <div className="setting-item-info">
          <div className="setting-item-name">Templates folder</div>
          <div className="setting-item-description">Choose a folder for document templates.</div>
        </div>
        <div className="setting-item-control">
          <input
            type="text"
            placeholder="Enter your path"
            value={templatePaths}
            onChange={(e) => handleSettingChange(e.target.value, setTemplatePaths, 'templatePaths')}
          />
        </div>
      </div>
    </div>
  );
};
