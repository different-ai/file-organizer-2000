import React, { useState, useEffect } from 'react';
import FileOrganizer from '../../index';
import { TFolder } from "obsidian";
import { logMessage } from "../../someUtils";
import { logger } from "../../services/logger";

interface FabricPromptManagerProps {
  plugin: FileOrganizer;
}

export const FabricPromptManager: React.FC<FabricPromptManagerProps> = ({ plugin }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [hasExistingPrompts, setHasExistingPrompts] = useState(false);

  useEffect(() => {
    checkExistingPrompts();
  }, []);

  const checkExistingPrompts = async () => {
    const patternsPath = plugin.settings.fabricPaths;
    await plugin.ensureFolderExists(patternsPath);
    const patternFolder = plugin.app.vault.getAbstractFileByPath(patternsPath);
    
    if (patternFolder && patternFolder instanceof TFolder) {
      setHasExistingPrompts(patternFolder.children.length > 0);
    }
  };

  const getLatestCommitSha = async () => {
    const response = await fetch('https://api.github.com/repos/danielmiessler/fabric/commits/main');
    const data = await response.json();
    return data.sha;
  };

  const downloadFile = async (url: string, path: string) => {
    const response = await fetch(url);
    const content = await response.text();
    await plugin.app.vault.create(path, content);
  };

  const handleDownloadOrUpdate = async () => {
    setIsLoading(true);
    setProgress(0);

    try {
      const latestSha = await getLatestCommitSha();
      const localShaPath = `${plugin.settings.fabricPaths}/.last_commit_sha`;
      let localSha = '';

      if (await plugin.app.vault.adapter.exists(localShaPath)) {
        localSha = await plugin.app.vault.adapter.read(localShaPath);
      }

      if (localSha !== latestSha) {
        const patternsPath = plugin.settings.fabricPaths;
        await plugin.app.vault.adapter.rmdir(patternsPath, true);
        await plugin.ensureFolderExists(patternsPath);

        const response = await fetch('https://api.github.com/repos/danielmiessler/fabric/git/trees/main?recursive=1');
        const data = await response.json();
        const patterns = data.tree.filter((item: any) => item.path.startsWith('patterns/') && item.type === 'blob');

        const totalItems = patterns.length;
        for (let i = 0; i < totalItems; i++) {
          const pattern = patterns[i];
          const localPath = `${patternsPath}/${pattern.path}`;
          await plugin.ensureFolderExists(localPath.substring(0, localPath.lastIndexOf('/')));
          await downloadFile(`https://raw.githubusercontent.com/danielmiessler/fabric/main/${pattern.path}`, localPath);
          setProgress(Math.round(((i + 1) / totalItems) * 100));
        }

        await plugin.app.vault.create(localShaPath, latestSha);
        setHasExistingPrompts(true);
      } else {
        logMessage('Prompts are already up to date');
      }
    } catch (error) {
      logger.error('Error downloading Fabric prompts:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="mt-4">
      <button
        className="px-4 py-2 bg-[--interactive-accent] text-[--text-on-accent] rounded hover:bg-[--interactive-accent-hover] focus:outline-none focus:ring-2 focus:ring-[--interactive-accent] focus:ring-opacity-50 disabled:opacity-50"
        onClick={handleDownloadOrUpdate}
        disabled={isLoading}
      >
        {hasExistingPrompts ? 'Update Fabric Prompts' : 'Download Fabric Prompts'}
      </button>
      {isLoading && (
        <div className="mt-2 bg-[--background-secondary] rounded-full h-5 overflow-hidden">
          <div 
            className="bg-[--interactive-accent] h-full transition-all duration-300 ease-in-out"
            style={{ width: `${progress}%` }}
          >
            <span className="absolute inset-0 flex items-center justify-center text-xs font-semibold text-[--text-on-accent]">
              {progress}%
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
