import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from "react-markdown";

export const AIMarkdown: React.FC<{ content: string }> = ({ content }) => {
  // Split content into lines/paragraphs
  const chunks = React.useMemo(() => {
    return content.split('\n').filter(Boolean);
  }, [content]);

  return (
    <div className="prose dark:prose-invert max-w-none">
      <AnimatePresence mode="popLayout">
        {chunks.map((chunk, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: 0.2,
              ease: "easeOut",
              delay: i * 0.1
            }}
          >
            <ReactMarkdown>{chunk}</ReactMarkdown>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};
