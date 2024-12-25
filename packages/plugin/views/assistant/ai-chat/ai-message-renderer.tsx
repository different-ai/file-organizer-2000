import React from "react";
import { App, getLinkpath } from "obsidian";
import ReactMarkdown from "react-markdown";
import { usePlugin } from "../provider";

interface AIMarkdownProps {
  content: string;
  app: App;
}

export const AIMarkdown: React.FC<AIMarkdownProps> = ({ content, app }) => {
  const plugin = usePlugin();
  const handleClick = (e: React.MouseEvent<HTMLElement>) => {
    const target = e.target as HTMLElement;
    const link = target.closest("a");

    if (!link) return;
    e.preventDefault();

    const href = link.getAttribute("data-href");
    if (!href) return;

    const linkpath = getLinkpath(href);

    plugin.app.workspace.openLinkText(linkpath, "", true);
  };

  return (
    <div className="card">
    <div className="markdown-preview-view p-0" onClick={handleClick}>
      {content.split(/(\[\[.*?\]\])/g).map((part, i) => {
        if (part.startsWith("[[") && part.endsWith("]]")) {
          const inner = part.slice(2, -2);
          const [target, alias] = inner.split("|");

          const linkpath = getLinkpath(target.trim());
          // get rid of extension if present for display text
          const displayText =
            alias?.trim() || target.trim().replace(/\.(md|markdown)$/, "");

          return (
            <a
              key={i}
              href={linkpath}
              className="internal-link"
              data-href={linkpath}
              rel="noopener"
              aria-label={`Open note ${displayText}`}
            >
              {displayText}
            </a>
          );
        }

        return (
          <ReactMarkdown
            key={i}
            components={{
              code: ({ inline, children, ...props }) =>
                inline ? (
                  <code {...props} className="inline-code">
                    {children}
                  </code>
                ) : (
                  <pre className="code-block">
                    <code {...props}>{children}</code>
                  </pre>
                ),
            }}
          >
            {part}
          </ReactMarkdown>
        );
        })}
      </div>
    </div>
  );
};
