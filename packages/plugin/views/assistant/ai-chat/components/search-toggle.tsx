import React, { useState } from 'react';
import { usePlugin } from '../../provider';
import { ModelType } from '../types';

interface SearchToggleProps {
  selectedModel: ModelType;
}

export function SearchToggle({ selectedModel }: SearchToggleProps) {
  const plugin = usePlugin();
  const [isEnabled, setIsEnabled] = useState(plugin.settings.enableSearchGrounding);

  const handleToggle = async () => {
    plugin.settings.enableSearchGrounding = !plugin.settings.enableSearchGrounding;
    await plugin.saveSettings();
    setIsEnabled(!isEnabled);
  };

  if (selectedModel !== 'gpt-4o') {
    return null;
  }

  return (
    <button
      onClick={handleToggle}
      className={`flex items-center space-x-1 text-sm px-2 py-1 rounded transition-colors ${
        isEnabled 
          ? "bg-blue-600 text-white hover:bg-blue-700" 
          : "bg-[--background-primary-alt] text-[--text-muted] hover:text-[--text-normal] hover:bg-[--background-modifier-hover]"
      }`}
      title={isEnabled ? "Disable internet search" : "Enable internet search"}
    >
      <svg
        className="w-4 h-4"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="12" cy="12" r="10" />
        <line x1="2" y1="12" x2="22" y2="12" />
        <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
      </svg>
      {isEnabled && <span>Search</span>}
    </button>
  );
}
