import React, { useState, useEffect } from 'react';
import FileOrganizer from '../../index';
import { FabricPromptManager } from './fabric-prompt-manager';
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface CustomizationTabProps {
  plugin: FileOrganizer;
}

export const CustomizationTab: React.FC<CustomizationTabProps> = ({ plugin }) => {
  const [settings, setSettings] = useState({
    useLogs: plugin.settings.useLogs,
    enableFileRenaming: plugin.settings.enableFileRenaming,
    renameInstructions: plugin.settings.renameInstructions,
    useSimilarTags: plugin.settings.useSimilarTags,
    useSimilarTagsInFrontmatter: plugin.settings.useSimilarTagsInFrontmatter,
    processedTag: plugin.settings.processedTag,
    enableFabric: plugin.settings.enableFabric,
    enableAliasGeneration: plugin.settings.enableAliasGeneration,
    enableSimilarFiles: plugin.settings.enableSimilarFiles,
    enableAtomicNotes: plugin.settings.enableAtomicNotes,
    enableScreenpipe: plugin.settings.enableScreenpipe,
    useVaultTitles: plugin.settings.useVaultTitles,
    enableCustomFolderInstructions: plugin.settings.enableCustomFolderInstructions,
    customFolderInstructions: plugin.settings.customFolderInstructions,
    enableDocumentClassification: plugin.settings.enableDocumentClassification,
    showLocalChatModel: plugin.settings.showLocalLLMInChat,
  });

  useEffect(() => {
    plugin.settings.useFolderEmbeddings = false;
    plugin.saveSettings();
  }, [plugin.settings]);

  const updateSetting = async (key: keyof typeof settings, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
    (plugin.settings[key] as any) = value;
    await plugin.saveSettings();
  };

  return (
    <div className="container mx-auto p-4 space-y-6">
      <div>
        <CardHeader>
          <CardTitle>AI Assistant Configuration</CardTitle>
          <CardDescription>Customize your Obsidian AI assistant settings</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="file-management">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="file-management">File Management</TabsTrigger>
              <TabsTrigger value="ai-features">AI Features</TabsTrigger>
              <TabsTrigger value="integrations">Integrations</TabsTrigger>
              <TabsTrigger value="advanced">Advanced</TabsTrigger>
            </TabsList>

            <TabsContent value="file-management">
              <Accordion type="multiple" defaultValue={["file-organization", "tagging"]}>
                <AccordionItem value="file-organization">
                  <AccordionTrigger>File Organization</AccordionTrigger>
                  <AccordionContent className="space-y-4">
                    <SettingItem
                      title="File Renaming"
                      description="Enable file renaming when a file goes through the inbox"
                      value={settings.enableFileRenaming}
                      onChange={(checked) => updateSetting('enableFileRenaming', checked)}
                    />

                    <div className="space-y-2">
                      <Label>Rename Instructions</Label>
                      <Textarea
                        value={settings.renameInstructions}
                        onChange={(e) => updateSetting('renameInstructions', e.target.value)}
                        placeholder="Provide instructions for renaming documents..."
                        className="min-h-[100px]"
                      />
                    </div>

                    <SettingItem
                      title="Custom Folder Logic"
                      description="Use custom instructions for folder placement"
                      value={settings.enableCustomFolderInstructions}
                      onChange={(checked) => updateSetting('enableCustomFolderInstructions', checked)}
                    />

                    <div className="space-y-2">
                      <Label>Custom Folder Instructions</Label>
                      <Textarea
                        value={settings.customFolderInstructions}
                        onChange={(e) => updateSetting('customFolderInstructions', e.target.value)}
                        placeholder="Provide custom instructions for folder placement..."
                        className="min-h-[100px]"
                        disabled={!settings.enableCustomFolderInstructions}
                      />
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="tagging">
                  <AccordionTrigger>Tagging System</AccordionTrigger>
                  <AccordionContent className="space-y-4">
                    <SettingItem
                      title="Similar Tags"
                      description="Append similar tags to processed files"
                      value={settings.useSimilarTags}
                      onChange={(checked) => updateSetting('useSimilarTags', checked)}
                    />

                    <SettingItem
                      title="Frontmatter Tags"
                      description="Add similar tags in frontmatter"
                      value={settings.useSimilarTagsInFrontmatter}
                      onChange={(checked) => updateSetting('useSimilarTagsInFrontmatter', checked)}
                    />

                    <div className="space-y-2">
                      <Label>Processed File Tag</Label>
                      <Input
                        value={settings.processedTag}
                        onChange={(e) => updateSetting('processedTag', e.target.value)}
                        placeholder="Enter tag for processed files..."
                      />
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </TabsContent>

            <TabsContent value="ai-features">
              <Accordion type="multiple" defaultValue={["core-features", "document-processing"]}>
                <AccordionItem value="core-features">
                  <AccordionTrigger>Core AI Features</AccordionTrigger>
                  <AccordionContent className="space-y-4">
                    <SettingItem
                      title="Alias Generation"
                      description="Enable the generation of aliases in the assistant sidebar"
                      value={settings.enableAliasGeneration}
                      onChange={(checked) => updateSetting('enableAliasGeneration', checked)}
                    />

                    <SettingItem
                      title="Similar Files"
                      description="Enable the display of similar files in the assistant sidebar"
                      value={settings.enableSimilarFiles}
                      onChange={(checked) => updateSetting('enableSimilarFiles', checked)}
                    />

                    <SettingItem
                      title="Atomic Notes"
                      description="Enable the generation of atomic notes in the assistant sidebar"
                      value={settings.enableAtomicNotes}
                      onChange={(checked) => updateSetting('enableAtomicNotes', checked)}
                    />
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="document-processing">
                  <AccordionTrigger>Document Processing</AccordionTrigger>
                  <AccordionContent className="space-y-4">
                    <SettingItem
                      title="Document Auto-Formatting"
                      description="Automatically format documents processed through the inbox"
                      value={settings.enableDocumentClassification}
                      onChange={(checked) => updateSetting('enableDocumentClassification', checked)}
                    />

                    <SettingItem
                      title="Personalized Titles"
                      description="Use random titles from your vault to improve AI-generated titles"
                      value={settings.useVaultTitles}
                      onChange={(checked) => updateSetting('useVaultTitles', checked)}
                    />
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </TabsContent>

            <TabsContent value="integrations">
              <Accordion type="multiple" defaultValue={["external-tools", "fabric"]}>
                <AccordionItem value="external-tools">
                  <AccordionTrigger>External Integrations</AccordionTrigger>
                  <AccordionContent className="space-y-4">
                    <SettingItem
                      title="Screenpipe Integration"
                      description="Enable Screenpipe integration for productivity analysis"
                      value={settings.enableScreenpipe}
                      onChange={(checked) => updateSetting('enableScreenpipe', checked)}
                    />
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="fabric">
                  <AccordionTrigger>Fabric Integration</AccordionTrigger>
                  <AccordionContent className="space-y-4">
                    <SettingItem
                      title="Fabric-like Formatting"
                      description="Use Fabric-like prompt structure for document formatting"
                      value={settings.enableFabric}
                      onChange={(checked) => updateSetting('enableFabric', checked)}
                    />

                    <div className="mt-4">
                      <button
                        onClick={() => {/* Add your prompt manager toggle logic here */}}
                        className={`w-full px-4 py-2 text-sm font-medium rounded-md 
                          ${settings.enableFabric 
                            ? 'bg-[--interactive-accent] text-[--text-on-accent] hover:bg-[--interactive-accent-hover]' 
                            : 'bg-[--background-modifier-border] text-[--text-muted] cursor-not-allowed'}`}
                        disabled={!settings.enableFabric}
                      >
                        Open Fabric Prompt Manager
                      </button>
                    </div>

                    {settings.enableFabric && (
                      <div className="mt-4">
                        <FabricPromptManager plugin={plugin} />
                      </div>
                    )}
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </TabsContent>

            <TabsContent value="advanced">
              <Accordion type="multiple" defaultValue={["logging"]}>
                <AccordionItem value="logging">
                  <AccordionTrigger>System Settings</AccordionTrigger>
                  <AccordionContent className="space-y-4">
                    <SettingItem
                      title="FileOrganizer Logs"
                      description="Keep track of changes made by File Organizer"
                      value={settings.useLogs}
                      onChange={(checked) => updateSetting('useLogs', checked)}
                    />

                    <SettingItem
                      title="Local Chat Model"
                      description="Use local chat instead of server-based chat"
                      value={settings.showLocalChatModel}
                      onChange={(checked) => updateSetting('showLocalChatModel', checked)}
                    />
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </TabsContent>
          </Tabs>
        </CardContent>
      </div>
    </div>
  );
};

interface SettingItemProps {
  title: string;
  description: string;
  value: boolean;
  onChange: (checked: boolean) => void;
}

const SettingItem: React.FC<SettingItemProps> = ({
  title,
  description,
  value,
  onChange
}) => (
  <div className="flex items-center justify-between">
    <div className="space-y-0.5">
      <Label className="text-base">{title}</Label>
      <p className="text-sm text-[--text-muted]">{description}</p>
    </div>
    <Switch
      checked={value}
      onCheckedChange={onChange}
    />
  </div>
);

export default CustomizationTab;
