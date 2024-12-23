import React, { useState, useEffect } from 'react';
import FileOrganizer from '../../index';
import { cleanPath } from '../../someUtils';
import { normalizePath } from 'obsidian';
import { Search } from 'lucide-react';
import { logger } from '../../services/logger';
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
  const [fabricPaths, setFabricPaths] = useState(plugin.settings.fabricPaths);

  const [warnings, setWarnings] = useState<Record<string, string>>({});
  const [pathExistence, setPathExistence] = useState<Record<string, boolean>>({});

  const FolderList = React.memo(() => {
    const [searchQuery, setSearchQuery] = useState('');
    const [filterType, setFilterType] = useState<'all' | 'active' | 'ignored'>('active');
    
    const allFolders = plugin.app.vault.getAllFolders()
    const availableFolders = plugin.getAllUserFolders();
    const ignoredFolders = plugin.getAllIgnoredFolders();

    const getFilteredFolders = () => {
      let folders = availableFolders;
      
      switch (filterType) {
        case 'all':
          folders = allFolders.map(folder => folder.path);
          break;
        case 'active':
          folders = availableFolders;
          break;
        case 'ignored':
          folders = ignoredFolders;
          break;
        default:
          folders = availableFolders;
      }

      return folders.filter(folder => 
        folder.toLowerCase().includes(searchQuery.toLowerCase())
      );
    };

    const filteredFolders = getFilteredFolders();

    return (
      <div className="mb-8 p-4 bg-[--background-secondary] rounded-lg shadow-sm">

        <div className="grid grid-cols-3 gap-4 mb-6">
          <button
            onClick={() => setFilterType('all')}
            className={` cursor-pointer p-4 flex flex-col items-center justify-center py-10 bg-[--background-primary] rounded-lg border border-[--background-modifier-border] transition-colors ${
              filterType === 'all' ? 'border-[--text-accent]' : ''
            }`}
          >
            <div className="text-3xl font-semibold text-[--text-accent]">{allFolders.length}</div>
            <div className="text-sm text-[--text-muted] mt-1">Total Folders</div>
          </button>
          <button
            onClick={() => setFilterType('active')}
            className={`cursor-pointer p-4 flex flex-col items-center justify-center py-10 bg-[--background-primary] rounded-lg border border-[--background-modifier-border] transition-colors ${
              filterType === 'active' ? 'border-[--text-accent]' : ''
            }`}
          >
            <div className="text-3xl font-semibold text-[--text-accent]">{availableFolders.length}</div>
            <div className="text-sm text-[--text-muted] mt-1">Active Paths</div>
          </button>
          <button
            onClick={() => setFilterType('ignored')}
            className={`cursor-pointer p-4 flex flex-col items-center justify-center py-10 bg-[--background-primary] rounded-lg border border-[--background-modifier-border] transition-colors ${
              filterType === 'ignored' ? 'border-[--text-accent]' : ''
            }`}
          >
            <div className="text-3xl font-semibold text-[--text-accent]">{ignoredFolders.length}</div>
            <div className="text-sm text-[--text-muted] mt-1">Ignored Paths</div>
          </button>
        </div>
        
        <div className="mb-2">
          <p className="text-sm text-[--text-muted] mb-2">
            Use the search box to verify folder accessibility
          </p>
          <p className="text-sm text-[--text-accent]">
            Currently showing: {filterType === 'all' ? 'all folders' : `${filterType} folders`}
          </p>
        </div>

        <div className="relative mb-3">
          <input
            type="text"
            placeholder="Search folders..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 py-2 bg-[--background-primary] border border-[--background-modifier-border] rounded-md text-[--text-normal]"
          />
          <Search 
            className="absolute left-3 top-1/2 -translate-y-1/2 text-[--text-muted] w-4 h-4" 
          />
        </div>

        <div 
          className="max-h-[240px] overflow-y-auto border border-[--background-modifier-border] rounded-md bg-[--background-primary]"
        >
          {filteredFolders.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-0.5">
              {filteredFolders.map((folder) => (
                <div 
                  key={folder}
                  className="px-3 py-2 text-[--text-normal] text-sm hover:bg-[--background-modifier-hover] cursor-default truncate"
                  title={folder}
                >
                  {folder}
                </div>
              ))}
            </div>
          ) : (
            <div className="p-4 text-center text-[--text-muted]">
              {searchQuery ? 'No matching folders found' : 'No available folders'}
            </div>
          )}
        </div>
      </div>
    );
  });

  const handleSettingChange = async (
    value: string,
    setter: React.Dispatch<React.SetStateAction<string>>,
    settingKey: keyof typeof plugin.settings
  ) => {
    setter(value);
    (plugin.settings as any)[settingKey] = value;
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
      logger.error(`Error checking path existence: ${error}`);
      return false;
    }
  };

  const createFolder = async (path: string) => {
    try {
      const normalizedPath = normalizePath(path);
      await plugin.app.vault.createFolder(normalizedPath);
      return true;
    } catch (error) {
      logger.error(`Error creating folder: ${error}`);
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
        templatePaths,
        fabricPaths
      ];

      const existenceResults = await Promise.all(
        pathsToCheck.map(async (path) => [path, await checkPathExistence(path)])
      );

      setPathExistence(Object.fromEntries(existenceResults));
    };

    checkPaths();
  }, [pathToWatch, attachmentsPath, logFolderPath, defaultDestinationPath, backupFolderPath, templatePaths, fabricPaths]);

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
    checkPath(fabricPaths, 'fabricPaths');

    // Special check for ignoreFolders
    if (ignoreFolders !== "*") {
      const folders = ignoreFolders.split(',');
      if (folders.some(folder => cleanPath(folder) !== folder.trim())) {
        newWarnings['ignoreFolders'] = "Some folder paths may need cleaning. Consider removing spaces or slashes.";
      }
    }

    setWarnings(newWarnings);
  }, [pathToWatch, attachmentsPath, logFolderPath, defaultDestinationPath, ignoreFolders, backupFolderPath, templatePaths, fabricPaths]);

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
      <div className="mb-8">
        <p className="text-[--text-muted] mb-4">
          Configure which folders File Organizer can manage and monitor. This helps you:
        </p>
        <ul className="list-disc pl-6 text-[--text-muted] space-y-1 mb-6">
          <li>Define which folders to watch for new files</li>
          <li>Set up ignored paths to exclude from organization</li>
          <li>Manage attachment and backup locations</li>
          <li>Configure template and pattern directories</li>
        </ul>
        <div className="p-4 bg-[--background-primary-alt] rounded-lg border border-[--background-modifier-border]">
          <p className="text-sm text-[--text-accent]">
            💡 Tip: Use the folder overview below to understand your vault structure and verify your path configurations.
          </p>
        </div>
      </div>

      <FolderList key={Object.values(plugin.settings).join(',')} />
      
      <div className="border-t border-[--background-modifier-border] ">
        <h3 className="mb-4 text-lg font-medium text-[--text-normal]">Path Configuration</h3>
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
        {renderSettingItem(
          "Fabric patterns folder",
          "Choose a folder for fabric patterns.",
          fabricPaths,
          (e) => handleSettingChange(e.target.value, setFabricPaths, 'fabricPaths'),
          'fabricPaths'
        )}
      </div>
    </div>
  );
};
