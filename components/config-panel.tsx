import { useState } from 'react'
import { Button } from "@/components/ui/button"
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

export function ConfigPanel({ plugin = {} as any }) {
  const [settings, setSettings] = useState({
    useLogs: plugin.settings?.useLogs || false,
    enableFileRenaming: plugin.settings?.enableFileRenaming || false,
    renameInstructions: plugin.settings?.renameInstructions || '',
    useSimilarTags: plugin.settings?.useSimilarTags || false,
    useSimilarTagsInFrontmatter: plugin.settings?.useSimilarTagsInFrontmatter || false,
    processedTag: plugin.settings?.processedTag || '',
    enableFabric: plugin.settings?.enableFabric || false,
    useFolderEmbeddings: plugin.settings?.useFolderEmbeddings || false,
    enableAliasGeneration: plugin.settings?.enableAliasGeneration || false,
    enableSimilarFiles: plugin.settings?.enableSimilarFiles || false,
    enableAtomicNotes: plugin.settings?.enableAtomicNotes || false,
    enableScreenpipe: plugin.settings?.enableScreenpipe || false,
    useVaultTitles: plugin.settings?.useVaultTitles || false,
    enableCustomFolderInstructions: plugin.settings?.enableCustomFolderInstructions || false,
    customFolderInstructions: plugin.settings?.customFolderInstructions || '',
    enableDocumentClassification: plugin.settings?.enableDocumentClassification || false,
    showLocalChatModel: plugin.settings?.showLocalLLMInChat || false,
  })

  const updateSetting = (key: string, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }))
    // Assuming plugin.saveSettings is an async function
    plugin.saveSettings?.({ ...settings, [key]: value })
  }

  return (
    <div className="container mx-auto p-4 space-y-6">
      <Card>
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
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="file-organization">
                  <AccordionTrigger>File Organization</AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="enableFileRenaming">Enable file renaming</Label>
                        <Switch
                          id="enableFileRenaming"
                          checked={settings.enableFileRenaming}
                          onCheckedChange={(checked) => updateSetting('enableFileRenaming', checked)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="renameInstructions">Rename Instructions</Label>
                        <Textarea
                          id="renameInstructions"
                          value={settings.renameInstructions}
                          onChange={(e) => updateSetting('renameInstructions', e.target.value)}
                          placeholder="Provide instructions for renaming documents..."
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label htmlFor="enableCustomFolderInstructions">Enable Custom Folder Logic</Label>
                        <Switch
                          id="enableCustomFolderInstructions"
                          checked={settings.enableCustomFolderInstructions}
                          onCheckedChange={(checked) => updateSetting('enableCustomFolderInstructions', checked)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="customFolderInstructions">Custom Folder Instructions</Label>
                        <Textarea
                          id="customFolderInstructions"
                          value={settings.customFolderInstructions}
                          onChange={(e) => updateSetting('customFolderInstructions', e.target.value)}
                          placeholder="Provide custom instructions for folder placement..."
                          disabled={!settings.enableCustomFolderInstructions}
                        />
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="tagging">
                  <AccordionTrigger>Tagging</AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="useSimilarTags">Use similar tags</Label>
                        <Switch
                          id="useSimilarTags"
                          checked={settings.useSimilarTags}
                          onCheckedChange={(checked) => updateSetting('useSimilarTags', checked)}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label htmlFor="useSimilarTagsInFrontmatter">Add similar tags in frontmatter</Label>
                        <Switch
                          id="useSimilarTagsInFrontmatter"
                          checked={settings.useSimilarTagsInFrontmatter}
                          onCheckedChange={(checked) => updateSetting('useSimilarTagsInFrontmatter', checked)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="processedTag">Processed File Tag</Label>
                        <Input
                          id="processedTag"
                          value={settings.processedTag}
                          onChange={(e) => updateSetting('processedTag', e.target.value)}
                          placeholder="Enter tag for processed files..."
                        />
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </TabsContent>
            <TabsContent value="ai-features">
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="ai-assistance">
                  <AccordionTrigger>AI Assistance</AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="enableAliasGeneration">Enable Alias Generation</Label>
                        <Switch
                          id="enableAliasGeneration"
                          checked={settings.enableAliasGeneration}
                          onCheckedChange={(checked) => updateSetting('enableAliasGeneration', checked)}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label htmlFor="enableSimilarFiles">Enable Similar Files</Label>
                        <Switch
                          id="enableSimilarFiles"
                          checked={settings.enableSimilarFiles}
                          onCheckedChange={(checked) => updateSetting('enableSimilarFiles', checked)}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label htmlFor="enableAtomicNotes">Enable Atomic Notes</Label>
                        <Switch
                          id="enableAtomicNotes"
                          checked={settings.enableAtomicNotes}
                          onCheckedChange={(checked) => updateSetting('enableAtomicNotes', checked)}
                        />
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="ai-models">
                  <AccordionTrigger>AI Models</AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="useFolderEmbeddings">Use Folder Embeddings</Label>
                        <Switch
                          id="useFolderEmbeddings"
                          checked={settings.useFolderEmbeddings}
                          onCheckedChange={(checked) => updateSetting('useFolderEmbeddings', checked)}
                        />
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </TabsContent>
            <TabsContent value="integrations">
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="external-tools">
                  <AccordionTrigger>External Tools</AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="enableScreenpipe">Enable Screenpipe Integration</Label>
                        <Switch
                          id="enableScreenpipe"
                          checked={settings.enableScreenpipe}
                          onCheckedChange={(checked) => updateSetting('enableScreenpipe', checked)}
                        />
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="fabric">
                  <AccordionTrigger>Fabric Integration</AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="enableFabric">Enable Fabric-like Formatting</Label>
                        <Switch
                          id="enableFabric"
                          checked={settings.enableFabric}
                          onCheckedChange={(checked) => updateSetting('enableFabric', checked)}
                        />
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </TabsContent>
            <TabsContent value="advanced">
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="advanced-features">
                  <AccordionTrigger>Advanced Features</AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="useVaultTitles">Use Personalized Titles</Label>
                        <Switch
                          id="useVaultTitles"
                          checked={settings.useVaultTitles}
                          onCheckedChange={(checked) => updateSetting('useVaultTitles', checked)}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label htmlFor="enableDocumentClassification">Enable Document Auto-Formatting</Label>
                        <Switch
                          id="enableDocumentClassification"
                          checked={settings.enableDocumentClassification}
                          onCheckedChange={(checked) => updateSetting('enableDocumentClassification', checked)}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label htmlFor="showLocalChatModel">Use Local Chat Model</Label>
                        <Switch
                          id="showLocalChatModel"
                          checked={settings.showLocalChatModel}
                          onCheckedChange={(checked) => updateSetting('showLocalChatModel', checked)}
                        />
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="logging">
                  <AccordionTrigger>Logging</AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="useLogs">Enable FileOrganizer logs</Label>
                        <Switch
                          id="useLogs"
                          checked={settings.useLogs}
                          onCheckedChange={(checked) => updateSetting('useLogs', checked)}
                        />
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
      <div className="flex justify-end">
        <Button onClick={() => console.log('Settings saved:', settings)}>Save Settings</Button>
      </div>
    </div>
  )
}