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
  const [keyStatus, setKeyStatus] = useState<'valid' | 'invalid' | 'checking' | 'idle'>(
    plugin.settings.API_KEY ? 'checking' : 'idle'
  );

  // Check key status on mount if we have a key
  useEffect(() => {
    if (plugin.settings.API_KEY) {
      checkLicenseStatus();
    }
  }, []);

  const checkLicenseStatus = async () => {
    if (!licenseKey) return;
    setKeyStatus('checking');
    const isValid = await plugin.isLicenseKeyValid(licenseKey);
    setKeyStatus(isValid ? 'valid' : 'invalid');
  };

  const handleLicenseKeyChange = async (value: string) => {
    setLicenseKey(value);
    setKeyStatus('idle');
    plugin.settings.API_KEY = value;
    await plugin.saveSettings();
  };

  const handleActivate = async () => {
    await checkLicenseStatus();
  };

  const getStatusIndicator = () => {
    switch (keyStatus) {
      case 'valid':
        return (
          <div className="flex items-center text-[--text-success] text-sm">
            <svg className="w-4 h-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            License key activated
          </div>
        );
      case 'invalid':
        return (
          <div className="flex items-center text-[--text-error] text-sm">
            <svg className="w-4 h-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
            Invalid license key
          </div>
        );
      case 'checking':
        return (
          <div className="flex items-center text-[--text-muted] text-sm">
            <svg className="w-4 h-4 mr-1.5 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            Checking license key...
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="file-organizer-settings space-y-6">
      <div className="bg-[--background-primary-alt] p-4 rounded-lg">
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-medium mb-2 mt-0">File Organizer License Key</h3>
            <p className="text-[--text-muted] mb-4">
              Enter your license key to activate File Organizer 2000.
            </p>
          </div>
          
          <div className="space-y-2">
            <div className="flex gap-2">
              <input
                type="text"
                className={`flex-1 bg-[--background-primary] border rounded px-3 py-1.5 ${keyStatus === 'valid' ? 'border-[--text-success]' : 
                  keyStatus === 'invalid' ? 'border-[--text-error]' : 
                  'border-[--background-modifier-border]'}`}
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
            {getStatusIndicator()}
          </div>
        </div>
      </div>

      <div className="bg-[--background-primary-alt] p-4 rounded-lg">
        <h3 className="text-lg font-medium mb-4 mt-0">Quick Tutorial</h3>
        <div className="youtube-embed">
          <iframe
            width="100%"
            height="315"
            src="https://www.youtube.com/embed/dRtLCBFzTAo?si=eo0h8dxTW-AIsNpp"
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          ></iframe>
        </div>
      </div>

      <AccountData 
        plugin={plugin} 
        onLicenseKeyChange={handleLicenseKeyChange}
      />

      <div className="bg-[--background-primary-alt] p-4 rounded-lg">
        <p className="file-organizer-support-text mb-4">
          File Organizer 2000 is an open-source initiative developed by two
          brothers. If you find it valuable, please{" "}
          <a
            href="https://fileorganizer2000.com/?utm_source=obsidian&utm_medium=in-app&utm_campaign=support-us"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[--text-accent] hover:text-[--text-accent-hover]"
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
