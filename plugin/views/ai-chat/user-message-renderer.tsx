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
        } else {
          // Fallback rendering when no MarkdownView is available
          await MarkdownRenderer.renderMarkdown(
            content,
            containerRef.current,
            "",
            null
          );
        }
      } catch (e) {
        console.error("Error rendering markdown:", e);
        containerRef.current.innerHTML = `<p>Error rendering content: ${e.message}</p>`;
      }
    };

    renderMarkdown();
  }, [content, plugin.app, plugin.app.workspace]);

  return <div ref={containerRef} className="simple-obsidian-renderer" />;
};