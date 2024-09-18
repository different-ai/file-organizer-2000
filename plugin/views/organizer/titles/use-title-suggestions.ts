import * as React from "react";
import { TFile } from "obsidian";
import { experimental_useObject as useObject } from "ai/react";
import FileOrganizer from "../../../index";
import { titleSchema } from "./box";
import { debounce } from "lodash";

export const useTitleSuggestions = (
  plugin: FileOrganizer,
  file: TFile | null,
  refreshKey: number
) => {
  const { object, submit: originalSubmit, isLoading, error, stop: originalStop } = useObject({
    api: `${plugin.getServerUrl()}/api/title/multiple-stream`,
    schema: titleSchema,
    fetch: async (URL, req) => {
      const response = await fetch(URL, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${plugin.settings.API_KEY}`,
          "Content-Type": "application/json",
        },
        body: req?.body,
      });
      return response;
    },
  });

  // Memoize submit and stop to ensure stability
  const submit = React.useCallback(originalSubmit, [originalSubmit]);
  const stop = React.useCallback(originalStop, [originalStop]);
  const [retryCount, setRetryCount] = React.useState(0);

  React.useEffect(() => {
    // Prevent fetching if no file is provided
    if (!file) return;

    // Debounced fetch function to prevent rapid consecutive calls
    const debouncedFetch = debounce(async () => {
      try {
        stop(); // Stop any ongoing fetch before starting a new one
        const content = await plugin.app.vault.read(file);
        const renameInstructions = plugin.settings.renameInstructions;
        const vaultTitles = plugin.settings.useVaultTitles
          ? plugin.getRandomVaultTitles(20)
          : [];

        submit({
          document: content,
          renameInstructions,
          currentName: file.basename,
          vaultTitles,
        });
      } catch (err) {
        console.error("Error fetching title suggestions:", err);
      }
    }, 300); // 300ms debounce

    debouncedFetch();

    // Cleanup debounce on unmount or dependency change
    return () => {
      debouncedFetch.cancel();
    };
  }, [file, refreshKey, retryCount, ]);

  const retry = React.useCallback(() => {
    setRetryCount((prev) => prev + 1);
  }, []);

  return {
    titles: object?.names || [],
    isLoading,
    error,
    retry,
  };
};
