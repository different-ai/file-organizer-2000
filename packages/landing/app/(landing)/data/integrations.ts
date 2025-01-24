import { ReactNode } from 'react'

interface Integration {
  name: string;
  status: 'active' | 'coming-soon';
  description: string;
  icon?: string | React.ComponentType<{ className?: string }>;
}

// Type-safe enterprise integrations
export const enterpriseIntegrations: readonly Integration[] = [
  {
    name: 'Obsidian Plugin',
    status: 'active',
    description: 'Seamlessly organize your notes and files within Obsidian.',
  },
  {
    name: 'AI-Powered Classification',
    status: 'active',
    description: 'Automatically classify and organize your documents using advanced AI.',
  },
  {
    name: 'Smart Tagging',
    status: 'active',
    description: 'Intelligent tag suggestions based on content analysis.',
  },
  {
    name: 'Meeting Notes Enhancement',
    status: 'active',
    description: 'Automatically enhance and structure your meeting notes.',
  },
  {
    name: 'File Formatting',
    status: 'active',
    description: 'Consistent formatting across your documents.',
  },
  {
    name: 'Custom Templates',
    status: 'active',
    description: 'Create and apply custom templates for different document types.',
  },
  {
    name: 'Automated File Movement',
    status: 'active',
    description: 'Smart file organization based on content and context.',
  },
  {
    name: 'Screenpipe Integration',
    status: 'active',
    description: 'Capture and transcribe audio for meeting notes.',
    icon: `<svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="32" height="32" rx="16" fill="#001B44"/>
      <path d="M23.3333 12.6667L16 8L8.66667 12.6667M23.3333 12.6667L16 17.3333M23.3333 12.6667V19.3333L16 24M16 17.3333L8.66667 12.6667M16 17.3333V24M8.66667 12.6667V19.3333L16 24" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>`,
  },
] as const;

// Export type for use in other components
export type IntegrationType = typeof enterpriseIntegrations[number];    