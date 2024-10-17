import React, { useState, useEffect } from 'react';
import FileOrganizer from '../../index';
import { cleanPath } from '../../../utils';
import { normalizePath, Vault } from 'obsidian';

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

  const [warnings, setWarnings] = useState<Record<string, string>>({});
  const [pathExistence, setPathExistence] = useState<Record<string, boolean>>({});

  const handleSettingChange = async (
    value: string,
    setter: React.Dispatch<React.SetStateAction<string>>,
    settingKey: keyof typeof plugin.settings
  ) => {
    setter(value);
    plugin.settings[settingKey] = value;
    await plugin.saveSettings();
  };

  const handleIgnoreFoldersChange = async (value: string) => {
    setIgnoreFolders(value);
    const trimmedValue = value.trim();
    if (trimmedValue === "*") {
      plugin.settings.ignoreFolders = ["*"];
    } else {
      plugin.settings.ignoreFolders = trimmedValue.split(",");
    }
    await plugin.saveSettings();
  };

  const checkPathExistence = async (path: string): Promise<boolean> => {
    try {
      const normalizedPath = normalizePath(path);
      const exists = await plugin.app.vault.adapter.exists(normalizedPath);
      return exists;
    } catch (error) {
      console.error(`Error checking path existence: ${error}`);
      return false;
    }
  };

  const createFolder = async (path: string) => {
    try {
      const normalizedPath = normalizePath(path);
      await plugin.app.vault.createFolder(normalizedPath);
      return true;
    } catch (error) {
      console.error(`Error creating folder: ${error}`);
      return false;
    }
  };

  useEffect(() => {
    const checkPaths = async () => {
      const pathsToCheck = [
        pathToWatch,
        attachmentsPath,
        logFolderPath,
        defaultDestinationPath,
        backupFolderPath,
        templatePaths
      ];

      const existenceResults = await Promise.all(
        pathsToCheck.map(async (path) => [path, await checkPathExistence(path)])
      );

      setPathExistence(Object.fromEntries(existenceResults));
    };

    checkPaths();
  }, [pathToWatch, attachmentsPath, logFolderPath, defaultDestinationPath, backupFolderPath, templatePaths]);

  useEffect(() => {
    const newWarnings: Record<string, string> = {};
    
    const checkPath = (path: string, key: string) => {
      if (path && cleanPath(path) !== path) {
        newWarnings[key] = "Path may contain leading/trailing slashes or spaces. Consider cleaning it.";
      }
    };

    checkPath(pathToWatch, 'pathToWatch');
    checkPath(attachmentsPath, 'attachmentsPath');
    checkPath(logFolderPath, 'logFolderPath');
    checkPath(defaultDestinationPath, 'defaultDestinationPath');
    checkPath(backupFolderPath, 'backupFolderPath');
    checkPath(templatePaths, 'templatePaths');

    // Special check for ignoreFolders
    if (ignoreFolders !== "*") {
      const folders = ignoreFolders.split(',');
      if (folders.some(folder => cleanPath(folder) !== folder.trim())) {
        newWarnings['ignoreFolders'] = "Some folder paths may need cleaning. Consider removing spaces or slashes.";
      }
    }

    setWarnings(newWarnings);
  }, [pathToWatch, attachmentsPath, logFolderPath, defaultDestinationPath, ignoreFolders, backupFolderPath, templatePaths]);

  const renderSettingItem = (
    name: string,
    description: string,
    value: string,
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void,
    settingKey: string
  ) => (
    <div className="setting-item">
      <div className="setting-item-info">
        <div className="setting-item-name">{name}</div>
        <div className="setting-item-description">{description}</div>
        {warnings[settingKey] && (
          <div className="setting-item-warning" style={{ color: 'orange' }}>
            Warning: {warnings[settingKey]}
          </div>
        )}
        {pathExistence[value] === false && (
          <div className="setting-item-error" style={{ color: 'red' }}>
            Path does not exist.
            <button
              onClick={async () => {
                const created = await createFolder(value);
                if (created) {
                  setPathExistence({ ...pathExistence, [value]: true });
                }
              }}
            >
              Create folder
            </button>
          </div>
        )}
      </div>
      <div className="setting-item-control">
        <input
          type="text"
          placeholder="Enter your path"
          value={value}
          onChange={onChange}
        />
      </div>
    </div>
  );

  return (
    <div className="file-config-settings">
      {renderSettingItem(
        "Inbox folder",
        "Choose which folder to automatically organize files from",
        pathToWatch,
        (e) => handleSettingChange(e.target.value, setPathToWatch, 'pathToWatch'),
        'pathToWatch'
      )}
      {renderSettingItem(
        "Attachments folder",
        "Enter the path to the folder where the original images will be moved.",
        attachmentsPath,
        (e) => handleSettingChange(e.target.value, setAttachmentsPath, 'attachmentsPath'),
        'attachmentsPath'
      )}
      {renderSettingItem(
        "File Organizer log folder",
        "Choose a folder for Organization Logs e.g. Ava/Logs.",
        logFolderPath,
        (e) => handleSettingChange(e.target.value, setLogFolderPath, 'logFolderPath'),
        'logFolderPath'
      )}
      {renderSettingItem(
        "Output folder path",
        "Enter the path where you want to save the processed files. e.g. Processed/myfavoritefolder",
        defaultDestinationPath,
        (e) => handleSettingChange(e.target.value, setDefaultDestinationPath, 'defaultDestinationPath'),
        'defaultDestinationPath'
      )}
      {renderSettingItem(
        "Ignore folders",
        "Enter folder paths to ignore during organization, separated by commas(e.g. Folder1,Folder2). Or * to ignore all folders",
        ignoreFolders,
        (e) => handleIgnoreFoldersChange(e.target.value),
        'ignoreFolders'
      )}
      {renderSettingItem(
        "Backup folder",
        "Choose a folder for file backups.",
        backupFolderPath,
        (e) => handleSettingChange(e.target.value, setBackupFolderPath, 'backupFolderPath'),
        'backupFolderPath'
      )}
      {renderSettingItem(
        "Templates folder",
        "Choose a folder for document templates.",
        templatePaths,
        (e) => handleSettingChange(e.target.value, setTemplatePaths, 'templatePaths'),
        'templatePaths'
      )}
    </div>
  );
};
