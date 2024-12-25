import React, { useEffect, useRef, useState } from "react";
import { MarkdownRenderer, MarkdownView, TFile } from "obsidian";
import { logger } from "../../../../services/logger";
import { usePlugin } from "../../provider";

interface MarkdownContentProps {
  content: string;
  className?: string;
  children?: React.ReactNode;
}

export const MarkdownContent: React.FC<MarkdownContentProps> = ({
  content,
  className = "",
  children
}) => {
  const contentRef = useRef<HTMLDivElement>(null);
  const plugin = usePlugin();
  const [activeFile, setActiveFile] = useState<TFile | null>(null);
  const [renderedContent, setRenderedContent] = useState("");

  // Link click handler
  useEffect(() => {
    if (!contentRef.current) return;

    const handleLinkClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const linkEl = target.closest('a');
      
      if (!linkEl) return;
      
      const href = linkEl.getAttribute('href');
      if (!href) return;

      if (href.startsWith('http://') || href.startsWith('https://')) {
        return;
      }

      e.preventDefault();
      
      let linktext = href;
      if (href.startsWith('[[')) {
        linktext = href.replace(/^\[\[/, '').replace(/\]\]$/, '');
      }
      
      plugin.app.workspace.openLinkText(
        linktext,
        activeFile?.path || '',
        e.ctrlKey || e.metaKey
      );
    };

    contentRef.current.addEventListener('click', handleLinkClick);
    return () => {
      contentRef.current?.removeEventListener('click', handleLinkClick);
    };
  }, [plugin.app, activeFile, contentRef.current]);

  // Markdown rendering
  useEffect(() => {
    const renderMarkdown = async () => {
      if (!plugin.app) return;

      try {
        const leaf = plugin.app.workspace.getMostRecentLeaf();
        const tempContainer = document.createElement("div");
        
        if (leaf?.view instanceof MarkdownView) {
          await MarkdownRenderer.render(
            plugin.app,
            content,
            tempContainer,
            leaf.view.file?.path || '',
            leaf.view
          );
        } else {
          await MarkdownRenderer.renderMarkdown(
            content,
            tempContainer,
            '',
            plugin
          );
        }
        
        setRenderedContent(tempContainer.innerHTML);
      } catch (e) {
        logger.error("Error rendering markdown:", e);
        setRenderedContent(`<p>Error rendering content: ${e.message}</p>`);
      }
    };

    renderMarkdown();
  }, [content, plugin.app]);

  // File tracking
  useEffect(() => {
    if (!plugin.app) return;
    const updateActiveFile = () => setActiveFile(plugin.app.workspace.getActiveFile());
    updateActiveFile();
    const eventRef = plugin.app.workspace.on("file-open", updateActiveFile);
    return () => plugin.app.workspace.offref(eventRef);
  }, [plugin.app]);

  return (
    <div className={`markdown-content-wrapper ${className}`}>
      {children}
      <div 
        ref={contentRef}
        className="markdown-rendered select-text"
        dangerouslySetInnerHTML={{ __html: renderedContent }}
      />
    </div>
  );
};
