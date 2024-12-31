import React from 'react';

interface Example {
  prompt: string;
  description: string;
  icon: string;
}

const examples: Example[] = [
  {
    prompt: "Move all my untitled notes to an 'Inbox' folder",
    description: "File organization",
    icon: "📁"
  },
  {
    prompt: "Rename my daily notes to include topics discussed",
    description: "Smart renaming",
    icon: "✏️"
  },
  {
    prompt: "Add a summary section to my meeting notes",
    description: "Content editing",
    icon: "➕"
  },
  {
    prompt: "Search for notes about project planning",
    description: "Smart search",
    icon: "🔍"
  },
  {
    prompt: "Tag my book notes with relevant categories",
    description: "Auto-tagging",
    icon: "🏷️"
  }
];

export const ExamplePrompts: React.FC<{
  onExampleClick: (prompt: string) => void;
}> = ({ onExampleClick }) => {
  return (
    <div className="flex flex-col gap-4 p-4 mx-auto max-w-xl">
      {examples.map((example, index) => (
        <button
          key={index}
          onClick={() => onExampleClick(example.prompt)}
          className="text-left p-4 rounded-lg border-2 border-[--background-modifier-border] hover:border-[--interactive-accent] bg-[--background-primary] hover:bg-[--background-primary] shadow-none transition-colors flex items-start gap-4 group w-full"
        >
          <div className="text-[--text-muted] group-hover:text-[--interactive-accent] text-xl">
            {example.icon}
          </div>
          <div className="flex-1">
            <p className="text-[--text-normal] font-medium mb-1.5">{example.prompt}</p>
            <span className="text-[--text-muted] text-sm">{example.description}</span>
          </div>
        </button>
      ))}
    </div>
  );
}; 