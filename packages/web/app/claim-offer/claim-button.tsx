'use client';

import { useState } from "react";
import { claimTokens } from "./page";

export function ClaimButton() {
  const [loading, setLoading] = useState(false);
  const [claimed, setClaimed] = useState(false);
  const [error, setError] = useState("");
  const [maxTokens, setMaxTokens] = useState(0);

  async function handleClaim() {
    try {
      setLoading(true);
      setError("");
      
      const result = await claimTokens();

      if (result.success) {
        setClaimed(true);
        setMaxTokens(result.maxTokens);
      } else {
        setError(result.error || "Failed to claim tokens");
      }
    } catch (err: any) {
      setError(err.message || "Failed to claim tokens");
    } finally {
      setLoading(false);
    }
  }

  if (claimed) {
    return (
      <div className="text-center">
        <p className="text-green-600 font-semibold mb-2">🎉 Successfully claimed 5M tokens!</p>
        <p className="text-sm text-gray-600">Your new token limit: {maxTokens.toLocaleString()}</p>
      </div>
    );
  }

  return (
    <div className="text-center">
      <button
        onClick={handleClaim}
        disabled={loading}
        className="px-6 py-3 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {loading ? "Claiming..." : "Claim 5M Tokens"}
      </button>
      {error && (
        <p className="mt-2 text-red-600 text-sm">{error}</p>
      )}
    </div>
  );
}
