import React from "react";
import { init, get_encoding } from "tiktoken/init";
import wasmBinary from "tiktoken/tiktoken_bg.wasm"; // This is now an ArrayBuffer
import { usePlugin } from "../organizer/provider";

interface ContextLimitIndicatorProps {
  unifiedContext: string;
  maxContextSize: number;
}

const MAX_CHUNK_SIZE = 1024 * 1024; // 1MB chunk size

export const ContextLimitIndicator: React.FC<ContextLimitIndicatorProps> = ({
  unifiedContext,
  maxContextSize,
}) => {
  const [encoding, setEncoding] = React.useState<any>(null);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let isMounted = true;
    let encoder: any = null;

    (async () => {
      try {
        if (!globalThis.tiktokenInitialized) {
          await init((imports) => WebAssembly.instantiate(wasmBinary, imports));
          globalThis.tiktokenInitialized = true;
        }

        if (isMounted) {
          encoder = get_encoding("cl100k_base");
          setEncoding(encoder);
          setError(null);
        }
      } catch (error) {
        console.error("Error initializing tiktoken:", error);
        setError("Failed to initialize token counter. Please reload the app.");
      }
    })();

    return () => {
      isMounted = false;
      if (encoder) {
        try {
          encoder.free();
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
      if (!unifiedContext || typeof unifiedContext !== 'string') {
        throw new Error('Invalid input: context must be a non-empty string');
      }

      // Process text in chunks if it's too large
      let totalTokens = 0;
      for (let i = 0; i < unifiedContext.length; i += MAX_CHUNK_SIZE) {
        const chunk = unifiedContext.slice(i, i + MAX_CHUNK_SIZE);
        const tokens = encoding.encode(chunk);
        totalTokens += tokens.length;

        if (tokens && Array.isArray(tokens)) {
          encoding.free_tokens(tokens);
        }

        // Early exit if already over limit
        if (totalTokens > maxContextSize) {
          break;
        }
      }

      return {
        contextSize: totalTokens,
        percentUsed: (totalTokens / maxContextSize) * 100,
      };
    } catch (e) {
      console.error("Error counting tokens:", e);
      setError('Token counting failed. Context may be too large.');
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