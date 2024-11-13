import React from "react";
import { init, get_encoding } from "tiktoken/init";
import wasmBinary from "tiktoken/tiktoken_bg.wasm"; // This is now an ArrayBuffer

interface ContextLimitIndicatorProps {
  unifiedContext: Array<{ content: string }>;
  maxContextSize: number;
}

export const ContextLimitIndicator: React.FC<ContextLimitIndicatorProps> = ({
  unifiedContext,
  maxContextSize,
}) => {
  const [encoding, setEncoding] = React.useState<any>(null);

  React.useEffect(() => {
    let isMounted = true;

    (async () => {
      try {
        // Initialize the WASM module using the inlined binary
        await init((imports) => WebAssembly.instantiate(wasmBinary, imports));

        if (isMounted) {
          // Get the encoding
          const enc = get_encoding("cl100k_base");
          setEncoding(enc);
        }
      } catch (error) {
        console.error("Error initializing tiktoken:", error);
      }
    })();

    return () => {
      isMounted = false;
      if (encoding) {
        encoding.free();
      }
    };
  }, []);

  const { contextSize, percentUsed } = React.useMemo(() => {
    if (!encoding) {
      return { contextSize: 0, percentUsed: 0 };
    }
    let totalTokens = 0;
    unifiedContext.forEach((item) => {
      totalTokens += encoding.encode(item.content).length;
    });

    return {
      contextSize: totalTokens,
      percentUsed: (totalTokens / maxContextSize) * 100,
    };
  }, [unifiedContext, maxContextSize, encoding]);

  const isOverLimit = contextSize > maxContextSize;

  return (
    <div
      className={`mt-2 p-2 rounded text-xs flex gap-1 items-center justify-between
        ${
          isOverLimit
            ? "bg-[--background-modifier-error] border border-[--text-error] text-[--text-error]"
            : "bg-[--background-modifier-border] text-[--text-muted]"
        }`}
    >
      <span>
        {isOverLimit
          ? "Context size exceeds maximum. Please remove some context to continue."
          : "Context used"}
      </span>
      <span className="font-mono">{percentUsed.toFixed(0)}%</span>
    </div>
  );
};