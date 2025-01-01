import React from "react";
import { init, get_encoding } from "tiktoken/init";
import wasmBinary from "tiktoken/tiktoken_bg.wasm";
import { useDebouncedCallback } from 'use-debounce';
import { logger } from "../../../services/logger";
import { useContextItems } from "./use-context-items";

interface TokenStats {
  contextSize: number;
  percentUsed: number;
}

export function ContextLimitIndicator({ 
  unifiedContext, 
  maxContextSize 
}: { 
  unifiedContext: string;
  maxContextSize: number;
}) {
  const [stats, setStats] = React.useState<TokenStats>({ contextSize: 0, percentUsed: 0 });
  const [error, setError] = React.useState<string>();
  const [tiktokenInitialized, setTiktokenInitialized] = React.useState(false);
  const { isLightweightMode, toggleLightweightMode } = useContextItems();

  // Initialize encoder once on mount
  React.useEffect(() => {
    async function setup() {
      try {
        if (!tiktokenInitialized) {
          await init((imports) => WebAssembly.instantiate(wasmBinary, imports));
          setTiktokenInitialized(true);
        }
      } catch (e) {
        setError('Failed to initialize token counter');
      }
    }

    setup();
  }, []);

  // Debounced token calculation
  const calculateTokens = useDebouncedCallback((text: string) => {
    if (!text || !tiktokenInitialized) return;
    const encoder = get_encoding("cl100k_base");
    
    try {
      const tokens = encoder.encode(text);
      logger.debug("tokens", { tokens });
      setStats({
        contextSize: tokens.length,
        percentUsed: (tokens.length / maxContextSize) * 100
      });
    } catch {
      setError('Token counting failed');
    } finally {
      encoder.free();
    }
  }, 300);

  // Update tokens when context changes
  React.useEffect(() => {
    calculateTokens(unifiedContext);
  }, [unifiedContext]);

  if (error) {
    return <div className="mt-2 p-2 rounded text-xs text-[--text-error] border border-[--text-error]">{error}</div>;
  }

  const isOverLimit = stats.contextSize > maxContextSize;
  const shouldWarn = stats.percentUsed > 80;
  
  return (
    <div className="mt-2 space-y-2">
      <div className={`p-2 rounded text-xs flex gap-1 items-center justify-between
        ${isOverLimit 
          ? "border border-[--text-error] text-[--text-error]" 
          : shouldWarn
            ? "border border-[--text-warning] text-[--text-warning]"
            : "bg-[--background-modifier-border] text-[--text-muted]"}`}>
        <span>
          {isOverLimit 
            ? "Context size exceeds maximum" 
            : shouldWarn
              ? "Context size nearing limit"
              : "Context used"}
        </span>
        <span className="font-mono">{stats.percentUsed.toFixed(0)}%</span>
      </div>
      
      <button
        onClick={toggleLightweightMode}
        title="Enable when processing multiple files to remove content from context. Useful for batch operations like moving, renaming, or tagging files."
        className={`w-full p-2 rounded text-xs flex items-center justify-between group relative
          ${isLightweightMode 
            ? "bg-[--interactive-accent] text-[--text-on-accent]" 
            : "bg-[--background-modifier-border] text-[--text-muted] hover:bg-[--background-modifier-border-hover]"}`}
      >
        <span>Disable Context</span>
        <div className="absolute bottom-full left-0 w-full p-2 bg-[--background-secondary] rounded shadow-lg text-[--text-normal] opacity-0 group-hover:opacity-100 transition-opacity mb-2 text-left pointer-events-none">
          Use this when processing multiple files to reduce context size. Removes file content from context while preserving metadata for batch operations.
        </div>
      </button>
    </div>
  );
}