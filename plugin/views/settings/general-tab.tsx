import React, { useState, useEffect } from "react";
import { Notice } from "obsidian";
import FileOrganizer from "../../index";
import { logger } from "../../services/logger";
import { UsageStats } from "../../components/usage-stats";
import { TopUpCredits } from '../../views/settings/top-up-credits';
import { AccountData } from './account-data';

interface GeneralTabProps {
  plugin: FileOrganizer;
  userId: string;
  email: string;
}

interface UsageData {
  tokenUsage: number;
  maxTokenUsage: number;
  subscriptionStatus: string;
  currentPlan: string;
}

export const GeneralTab: React.FC<GeneralTabProps> = ({ plugin, userId, email }) => {
  const [licenseKey, setLicenseKey] = useState(plugin.settings.API_KEY);

  const handleLicenseKeyChange = async (value: string) => {
    setLicenseKey(value);
    plugin.settings.API_KEY = value;
    await plugin.saveSettings();
  };

  const handleActivate = async () => {
    const isValid = await plugin.isLicenseKeyValid(licenseKey);
    if (isValid) {
      new Notice("License key activated successfully!", 5000);
    } else {
      new Notice("Invalid license key. Please try again.");
    }
  };

  return (
    <div className="file-organizer-settings">
      <div className="bg-[--background-primary-alt] p-4 rounded-lg mb-6">
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-medium mb-2 mt-0">File Organizer License Key</h3>
            <p className="text-[--text-muted] mb-4">
              Enter your license key to activate File Organizer 2000.
            </p>
          </div>
          
          <div className="flex gap-2">
            <input
              type="text"
              className="flex-1 bg-[--background-primary] border border-[--background-modifier-border] rounded px-3 py-1.5"
              placeholder="Enter your File Organizer License Key"
              value={licenseKey}
              onChange={e => handleLicenseKeyChange(e.target.value)}
            />
            <button 
              onClick={handleActivate}
              className="bg-[--interactive-accent] text-[--text-on-accent] px-4 py-1.5 rounded hover:bg-[--interactive-accent-hover] transition-colors"
            >
              Activate
            </button>
          </div>
        </div>
      </div>

      <AccountData 
        plugin={plugin} 
        onLicenseKeyChange={handleLicenseKeyChange}
      />

      <div className="youtube-embed mt-6">
        <iframe
          width="100%"
          height="315"
          src="https://www.youtube.com/embed/dRtLCBFzTAo?si=eo0h8dxTW-AIsNpp"
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        ></iframe>
        <p className="file-organizer-support-text mt-4">
          File Organizer 2000 is an open-source initiative developed by two
          brothers. If you find it valuable, please{" "}
          <a
            href="https://fileorganizer2000.com/?utm_source=obsidian&utm_medium=in-app&utm_campaign=support-us"
            target="_blank"
            rel="noopener noreferrer"
          >
            consider supporting us
          </a>{" "}
          to help improve and maintain the project. 🙏
        </p>
        <p className="text-[--text-muted]">
          <a
            href="https://discord.gg/UWH53WqFuE"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[--text-accent] hover:text-[--text-accent-hover]"
          >
            Need help? Ask me on Discord.
          </a>
        </p>
      </div>
    </div>
  );
};
