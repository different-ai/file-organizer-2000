import React, { useEffect, useRef } from "react";
import { MarkdownRenderer, MarkdownView } from "obsidian";
import { usePlugin } from "./provider";

interface SimpleObsidianRendererProps {
  content: string;
}

export const UserMarkdown: React.FC<SimpleObsidianRendererProps> = ({
  content,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const plugin = usePlugin();

  useEffect(() => {
    const renderMarkdown = async () => {
      if (!plugin.app || !containerRef.current) return;

      try {
        const leaf = plugin.app.workspace.getMostRecentLeaf();
        if (leaf && leaf.view instanceof MarkdownView) {
          await MarkdownRenderer.render(
            plugin.app,
            content,
            containerRef.current,
            "",
            leaf.view
          );
        }
      } catch (e) {
        console.error("Error rendering markdown:", e);
        containerRef.current.innerHTML = "<p>Error rendering content</p>";
      }
    };

    renderMarkdown();
  }, [content, plugin.app]);

  return <div ref={containerRef} className="simple-obsidian-renderer" />;
};