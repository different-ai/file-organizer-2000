import * as React from "react";
import { TFile } from "obsidian";
import { experimental_useObject as useObject } from "ai/react";
import FileOrganizer from "../../../index";
import { titleSchema } from "../components/rename-suggestion";

export const useTitleSuggestions = (
  plugin: FileOrganizer,
  file: TFile | null,
  content: string,
  refreshKey: number
) => {
  const { object, submit, isLoading, error } = useObject({
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

  const [retryCount, setRetryCount] = React.useState(0);

  React.useEffect(() => {
    if (file && content) {
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
    }
  }, [file, content, refreshKey, plugin, retryCount]);

  const retry = () => setRetryCount(prev => prev + 1);

  return {
    titles: object?.names || [],
    isLoading,
    error,
    retry,
  };
};