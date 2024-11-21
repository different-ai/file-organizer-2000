import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from "react-markdown";
import { App, TFile } from "obsidian";

interface AIMarkdownProps {
  content: string;
  app: App;
}

export const AIMarkdown: React.FC<AIMarkdownProps> = ({ content, app }) => {
  // Split content into lines/paragraphs
  const chunks = React.useMemo(() => {
    return content.split("\n").filter(Boolean);
  }, [content]);

  const [copied, setCopied] = React.useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Custom link handler for Obsidian-specific links
  const handleClick = (e: React.MouseEvent<HTMLElement>) => {
    const target = e.target as HTMLElement;
    const link = target.closest("a");
    
    if (!link) return;
    e.preventDefault();

    const href = link.getAttribute("href");
    if (!href) return;

    // Handle different types of links
    if (href.startsWith("#")) {
      // Tag link
      const tag = href.slice(1);
      app.workspace.openLinkText(`tag:${tag}`, "");
    } else if (href.startsWith("folder://")) {
      // Folder link
      const folderPath = href.replace("folder://", "");
      const folder = app.vault.getAbstractFileByPath(folderPath);
      if (folder) {
        // Reveal folder in file explorer
        app.workspace.revealLeaf(
          app.workspace.getLeavesOfType("file-explorer")[0]
        );
        // TODO: Select the folder in file explorer (requires file-explorer API)
      }
    } else {
      // Regular file link
      app.workspace.openLinkText(href, "");
    }
  };

  // Custom components for ReactMarkdown
  const components = {
    a: ({ node, ...props }) => (
      <a
        {...props}
        className="internal-link"
        onClick={(e) => e.preventDefault()}
      />
    ),
  };

  return (
    <div className="space-y-2">
      <div className="flex justify-end">
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 px-2 py-1 text-xs rounded-sm
                     text[--text-muted] hover:text[--text-normal]
                     bg[--background-primary] hover:bg[--background-primary-alt]
                     transition-colors shadow-none"
        >
          <motion.div
            animate={{ scale: copied ? [1, 1.2, 1] : 1 }}
            transition={{ duration: 0.2 }}
          >
            <svg
              className="w-3.5 h-3.5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              {copied ? (
                <path d="M20 6L9 17l-5-5" />
              ) : (
                <>
                  <path d="M8 4v12a2 2 0 002 2h8a2 2 0 002-2V7.242a2 2 0 00-.602-1.43L16.083 2.57A2 2 0 0014.685 2H10a2 2 0 00-2 2z" />
                  <path d="M16 18v2a2 2 0 01-2 2H6a2 2 0 01-2-2V9a2 2 0 012-2h2" />
                </>
              )}
            </svg>
          </motion.div>
          {copied ? "Copied!" : "Copy"}
        </button>
      </div>
      <div 
        className="prose dark:prose-invert max-w-none select-text w-full"
        onClick={handleClick}
      >
        <AnimatePresence mode="popLayout">
          {chunks.map((chunk, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                type: "spring",
                stiffness: 100,
                damping: 20,
                delay: i * 0.2,
              }}
            >
              <ReactMarkdown components={components}>{chunk}</ReactMarkdown>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
};
