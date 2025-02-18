import React from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { App } from 'obsidian';
import { Sparkles, ChevronDown } from 'lucide-react';

interface ModelSelectorProps {
  selectedModel: string;
  onModelSelect: (model: string) => void;
  app: App;
}

export const ModelSelector: React.FC<ModelSelectorProps> = ({
  selectedModel,
  onModelSelect,
  app,
}) => {
  const availableModels = [
    { id: 'gpt-4', name: 'GPT-4', description: 'Most capable model, best for complex tasks' },
    { id: 'gpt-3.5-turbo', name: 'GPT-3.5', description: 'Faster, great for most tasks' },
    ...(app?.vault?.getConfig('enableOllama') === true
      ? [
          {
            id: 'deepseek-r1:1.5b',
            name: 'DeepSeek (Experimental)',
            description: 'Local Ollama model for testing',
          },
        ]
      : []),
  ];
  const currentModel = availableModels.find(model => model.id === selectedModel) || availableModels[0];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          className="h-8 px-3 flex items-center gap-2 bg-[--background-modifier-form-field] hover:bg-[--background-modifier-hover] text-[--text-normal] border-[--background-modifier-border]"
        >
          <Sparkles className="h-4 w-4" />
          {currentModel.name}
          <ChevronDown className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[200px]">
        {availableModels.map(model => (
          <DropdownMenuItem
            key={model.id}
            onClick={() => onModelSelect(model.id)}
            className="flex flex-col items-start py-2"
          >
            <div className="font-medium">{model.name}</div>
            <div className="text-xs text-[--text-muted]">{model.description}</div>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};                  