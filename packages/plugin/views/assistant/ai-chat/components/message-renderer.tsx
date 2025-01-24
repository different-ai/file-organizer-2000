import React from 'react';
import { Message } from '@ai-sdk/core';
import { Bot, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { marked } from 'marked';

interface MessageRendererProps {
  message: Message;
}

export const MessageRenderer: React.FC<MessageRendererProps> = ({ message }) => {
  const isUser = message.role === 'user';
  const icon = isUser ? <User className="h-6 w-6" /> : <Bot className="h-6 w-6" />;
  const bgColor = isUser ? 'bg-[--background-secondary]' : 'bg-[--background-primary]';
  const borderColor = isUser ? 'border-[--background-modifier-border]' : 'border-[--background-modifier-border-hover]';

  const renderedContent = React.useMemo(() => {
    if (!message.content) return '';
    return marked(message.content);
  }, [message.content]);

  return (
    <div className={cn(
      'flex gap-4 p-4 rounded-lg border',
      bgColor,
      borderColor
    )}>
      <div className={cn(
        'flex h-8 w-8 shrink-0 select-none items-center justify-center rounded-md border',
        isUser ? 'bg-[--background-modifier-form-field] border-[--background-modifier-border]' : 'bg-[--interactive-accent] bg-opacity-10 border-[--interactive-accent] border-opacity-20'
      )}>
        {icon}
      </div>
      <div className="flex-1 space-y-2 overflow-hidden">
        <div className="prose dark:prose-invert max-w-none break-words" 
          dangerouslySetInnerHTML={{ __html: renderedContent }} />
      </div>
    </div>
  );
}; 