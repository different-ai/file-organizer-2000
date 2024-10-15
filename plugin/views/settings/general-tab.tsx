import React, { useState } from 'react';
import { Notice } from 'obsidian';
import FileOrganizer from '../../index';

interface GeneralTabProps {
  plugin: FileOrganizer;
}

export const GeneralTab: React.FC<GeneralTabProps> = ({ plugin }) => {
  const [licenseKey, setLicenseKey] = useState(plugin.settings.API_KEY);

  const handleLicenseKeyChange = async (value: string) => {
    setLicenseKey(value);
    plugin.settings.API_KEY = value;
    await plugin.saveSettings();
  };

  const handleActivate = async () => {
    const isValid = await plugin.isLicenseKeyValid(licenseKey);
    if (isValid) {
      new Notice('License key activated successfully!', 5000);
    } else {
      new Notice('Invalid license key. Please try again.');
    }
  };

  return (
    <div className="file-organizer-settings">
      <div className="setting">
        <div className="setting-item">
          <div className="setting-item-info">
            <div className="setting-item-name">File Organizer License Key</div>
            <div className="setting-item-description">
              Get a license key to activate File Organizer 2000.
            </div>
          </div>
          <div className="setting-item-control">
            <input
              type="text"
              placeholder="Enter your File Organizer License Key"
              value={licenseKey}
              onChange={(e) => handleLicenseKeyChange(e.target.value)}
            />
            <button onClick={handleActivate}>Activate</button>
          </div>
        </div>
      </div>

      {plugin.settings.isLicenseValid && (
        <p className="license-status activated">License Status: Activated</p>
      )}

      <button
        className="file-organizer-login-button"
        onClick={() => window.open('https://fileorganizer2000.com/?utm_source=obsidian&utm_medium=in-app&utm_campaign=get-license', '_blank')}
      >
        Get License
      </button>

      <div className="youtube-embed">
        <iframe
          width="100%"
          height="315"
          src="https://www.youtube.com/embed/dRtLCBFzTAo?si=eo0h8dxTW-AIsNpp"
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        ></iframe>
        <p className="file-organizer-support-text">
          File Organizer 2000 is an open-source initiative developed by two brothers. If you find it valuable, please{' '}
          <a href="https://fileorganizer2000.com/?utm_source=obsidian&utm_medium=in-app&utm_campaign=support-us" target="_blank" rel="noopener noreferrer">
            consider supporting us
          </a>{' '}
          to help improve and maintain the project. 🙏
        </p>
      </div>
    </div>
  );
};
