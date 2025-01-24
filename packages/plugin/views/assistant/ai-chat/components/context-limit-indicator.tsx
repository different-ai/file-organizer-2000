import React from 'react';
import { Progress } from '@/components/ui/progress';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface ContextLimitIndicatorProps {
  unifiedContext: string;
  maxContextSize: number;
}

export const ContextLimitIndicator: React.FC<ContextLimitIndicatorProps> = ({
  unifiedContext,
  maxContextSize,
}) => {
  const contextSize = unifiedContext.length;
  const percentage = Math.min((contextSize / maxContextSize) * 100, 100);
  const isWarning = percentage > 75;
  const isDanger = percentage > 90;

  const getStatusColor = () => {
    if (isDanger) return 'bg-[--text-error]';
    if (isWarning) return 'bg-[--text-warning]';
    return 'bg-[--interactive-accent]';
  };

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div className="flex items-center gap-2">
          <Progress
            value={percentage}
            className="w-24 h-2"
            indicatorClassName={getStatusColor()}
          />
          <span className="text-xs text-[--text-muted]">
            {Math.round(percentage)}%
          </span>
        </div>
      </TooltipTrigger>
      <TooltipContent>
        <p>Context size: {contextSize} / {maxContextSize} characters</p>
      </TooltipContent>
    </Tooltip>
  );
}; 