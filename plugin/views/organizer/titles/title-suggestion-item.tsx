import * as React from "react";
import { motion } from "framer-motion";
import { CheckIcon } from "lucide-react";

interface TitleSuggestionProps {
  title: string;
  onApply: (title: string) => void;
}

export const TitleSuggestion: React.FC<TitleSuggestionProps> = ({
  title,
  onApply,
}) => {
  const [editableTitle, setEditableTitle] = React.useState(title);
  const [isFocused, setIsFocused] = React.useState(false);

  const handleApply = () => {
    onApply(editableTitle.trim());
  };

  return (
    <motion.div
      variants={itemVariants}
      className=""
    >
      <div className="flex items-center w-full gap-2">
        <input
          type="text"
          value={editableTitle}
          onChange={(e) => setEditableTitle(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              handleApply();
            }
          }}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          className={`flex-grow p-2 bg-transparent text-[--text-normal] rounded-md transition-all duration-200 ${
            isFocused
              ? "border border-[--interactive-accent] ring-2 ring-[--interactive-accent] ring-opacity-50"
              : "border border-transparent hover:border-[--background-modifier-border]"
          }`}
        />
        <button
          onClick={handleApply}
          className="p-2 text-[--text-muted] hover:text-[--text-normal] focus:outline-none focus:ring-2 focus:ring-[--interactive-accent] rounded-md transition-colors duration-200"
          aria-label="Apply title"
        >
          <CheckIcon className="w-5 h-5" />
        </button>
      </div>
    </motion.div>
  );
};

const itemVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.8 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: "spring",
      stiffness: 100,
      damping: 10,
    },
  },
};
