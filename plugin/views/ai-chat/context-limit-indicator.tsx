import React, { useEffect, useState } from "react";
import { getEncoding } from "js-tiktoken";

interface ContextLimitIndicatorProps {
  unifiedContext: Array<{ content: string }>;
  maxContextSize: number;
}

export const ContextLimitIndicator: React.FC<ContextLimitIndicatorProps> = ({
  unifiedContext,
  maxContextSize,
}) => {
  const [contextSize, setContextSize] = useState(0);
  const [percentUsed, setPercentUsed] = useState(0);

  useEffect(() => {
    const calculateContextSize = () => {
      const encoding = getEncoding("o200k_base");
      let totalTokens = 0;
      
      unifiedContext.forEach(item => {
        totalTokens += encoding.encode(item.content).length;
      });

      setContextSize(totalTokens);
      setPercentUsed((totalTokens / maxContextSize) * 100);
    };

    calculateContextSize();
  }, [unifiedContext, maxContextSize]);



  const isOverLimit = contextSize > maxContextSize;

  return (
    <div className={`mt-2 p-2 rounded text-xs flex gap-1 items-center justify-between
        ${isOverLimit 
          ? "bg-[--background-modifier-error] border border-[--text-error] text-[--text-error]" 
          : "bg-[--background-modifier-border] text-[--text-muted]"
        }`}
    >
      <span>
        {isOverLimit 
          ? "Context size exceeds maximum. Please remove some context to continue."
          : "Context used"}
      </span>
      <span className="font-mono">
        {percentUsed.toFixed(0)}%
      </span>
    </div>
  );
};
