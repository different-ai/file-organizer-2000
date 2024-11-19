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
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let isMounted = true;

    (async () => {
      try {
        await init((imports) => WebAssembly.instantiate(wasmBinary, imports));
        if (isMounted) {
          const enc = get_encoding("cl100k_base");
          setEncoding(enc);
        }
      } catch (error) {
        console.error("Error initializing tiktoken:", error);
        setError("Failed to initialize token counter");
      }
    })();

    return () => {
      isMounted = false;
      if (encoding) {
        try {
          encoding.free();
        } catch (e) {
          console.error("Error freeing encoder:", e);
        }
      }
    };
  }, []);

  const { contextSize, percentUsed } = React.useMemo(() => {
    if (!encoding || error) {
      return { contextSize: 0, percentUsed: 0 };
    }

    try {
      let totalTokens = 0;
      for (const item of unifiedContext) {
        if (item?.content && typeof item.content === 'string') {
          const safeContent = item.content.slice(0, 100000);
          totalTokens += encoding.encode(safeContent).length;
        }
      }

      return {
        contextSize: totalTokens,
        percentUsed: (totalTokens / maxContextSize) * 100,
      };
    } catch (e) {
      console.error("Error counting tokens:", e);
      setError("Failed to count tokens");
      return { contextSize: 0, percentUsed: 0 };
    }
  }, [unifiedContext, maxContextSize, encoding, error]);

  const isOverLimit = contextSize > maxContextSize;

  if (error) {
    return (
      <div className="mt-2 p-2 rounded text-xs text-[--text-error] border border-[--text-error]">
        {error}
      </div>
    );
  }

  return (
    <div
      className={`mt-2 p-2 rounded text-xs flex gap-1 items-center justify-between
        ${
          isOverLimit
            ? " border border-[--text-error] text-[--text-error]"
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