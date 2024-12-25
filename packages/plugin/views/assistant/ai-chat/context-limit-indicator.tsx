import React from "react";
import { init, get_encoding } from "tiktoken/init";
import wasmBinary from "tiktoken/tiktoken_bg.wasm";
import { useDebouncedCallback } from 'use-debounce';
import { logger } from "../../../services/logger";

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
    console.log("calculateTokens", { text, tiktokenInitialized });
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
  
  return (
    <div className={`mt-2 p-2 rounded text-xs flex gap-1 items-center justify-between
      ${isOverLimit ? "border border-[--text-error] text-[--text-error]" : "bg-[--background-modifier-border] text-[--text-muted]"}`}>
      <span>
        {isOverLimit ? "Context size exceeds maximum" : "Context used"}
      </span>
      <span className="font-mono">{stats.percentUsed.toFixed(0)}%</span>
    </div>
  );
}