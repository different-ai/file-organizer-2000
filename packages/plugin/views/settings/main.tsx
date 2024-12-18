import React, { useState } from 'react';
import FileOrganizer from '../../index';
import { GeneralTab } from './general-tab';
import { FileConfigTab } from './file-config-tab';
import { CustomizationTab } from './customization-tab';
import { AdvancedTab } from './advanced-tab';
import { ExperimentTab } from './experiment-tab';

interface Tab {
  name: string;
  component: React.ComponentType<{ plugin: FileOrganizer }>;
}

interface SettingsTabContentProps {
  plugin: FileOrganizer;
}

export const SettingsTabContent: React.FC<SettingsTabContentProps> = ({ plugin }) => {
  const [activeTab, setActiveTab] = useState('General');

  const tabs: Tab[] = [
    { name: 'General', component: GeneralTab },
    { name: 'Organization Preferences', component: CustomizationTab },
    { name: 'Vault Access', component: FileConfigTab },
    { name: 'Experiment', component: ExperimentTab },
    { name: 'Advanced', component: AdvancedTab },
  ];

  return (
    <div className="flex flex-col h-full">
      <TabNavigation tabs={tabs} activeTab={activeTab} onTabClick={setActiveTab} />
      <TabContent tabs={tabs} activeTab={activeTab} plugin={plugin} />
    </div>
  );
};

const TabNavigation: React.FC<{
  tabs: Tab[];
  activeTab: string;
  onTabClick: (tabName: string) => void;
}> = ({ tabs, activeTab, onTabClick }) => (
  <div className="flex w-full">
    {tabs.map((tab) => (
      <TabButton
        key={tab.name}
        name={tab.name}
        isActive={activeTab === tab.name}
        onClick={() => onTabClick(tab.name)}
      />
    ))}
  </div>
);

const TabButton: React.FC<{
  name: string;
  isActive: boolean;
  onClick: () => void;
}> = ({ name, isActive, onClick }) => (
  <div
    className={`w-min flex-1 py-2 px-4 text-sm font-medium text-center cursor-pointer select-none
      ${isActive
        ? 'border-t border-x border-gray-200 rounded-t-md -mb-px'
        : 'text-gray-600 border-b border-gray-200'
      }`}
    onClick={onClick}
  >
    {name}
  </div>
);

const TabContent: React.FC<{
  tabs: Tab[];
  activeTab: string;
  plugin: FileOrganizer;
}> = ({ tabs, activeTab, plugin }) => (
  <div className="flex-1 overflow-y-auto p-4 border border-gray-200 rounded-b-md">
    {tabs.map((tab) => (
      <div key={tab.name} className={activeTab === tab.name ? 'block' : 'hidden'}>
        <tab.component plugin={plugin} />
      </div>
    ))}
  </div>
);
