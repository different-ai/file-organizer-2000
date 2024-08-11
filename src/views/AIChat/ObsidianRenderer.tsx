import React, { useEffect, useRef } from "react";
import { MarkdownRenderer, MarkdownView } from "obsidian";
import FileOrganizer from "../..";
import { useApp } from "./AppContext";

interface ObsidianRendererProps {
  content: string;
  plugin: FileOrganizer;
}

export const ObsidianRenderer: React.FC<ObsidianRendererProps> = ({
  content,
  plugin,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const app = useApp();
  console.log(plugin);

  useEffect(() => {
    if (!plugin?.app) return;
    if (containerRef.current) {
      MarkdownRenderer.render(
        plugin.app,
        content,
        containerRef.current,
        "",
        plugin
      );
    }
  }, [content, plugin]);

  return <div ref={containerRef} />;
};
