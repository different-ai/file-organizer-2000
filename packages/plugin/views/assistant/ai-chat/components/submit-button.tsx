import React from 'react';
import { Button } from '@/components/ui/button';
import { Send } from 'lucide-react';

interface SubmitButtonProps {
  isGenerating: boolean;
}

export const SubmitButton: React.FC<SubmitButtonProps> = ({ isGenerating }) => {
  return (
    <Button
      type="submit"
      disabled={isGenerating}
      className="h-8 px-3 flex items-center gap-2 bg-[--interactive-accent] hover:bg-[--interactive-accent-hover] text-[--text-on-accent]"
    >
      <Send className="h-4 w-4" />
      {isGenerating ? 'Sending...' : 'Send'}
    </Button>
  );
}; 