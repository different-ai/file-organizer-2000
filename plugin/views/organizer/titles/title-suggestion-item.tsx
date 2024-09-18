import * as React from "react";
import { motion } from "framer-motion";
import { CheckIcon as CheckMark } from "lucide-react"; // Import the CheckMark icon

interface TitleSuggestionProps {
  title: string;
  onApply: (title: string) => void;
}

export const TitleSuggestion: React.FC<TitleSuggestionProps> = ({
  title,
  onApply,
}) => {
  const [editableTitle, setEditableTitle] = React.useState(title);

  return (
    <motion.div
      variants={itemVariants}
      className="title-suggestion-item flex items-center"
      style={{
        width: "100%",
        display: "flex",
        alignItems: "center",
        gap: "8px",
      }}
    >
      <input
        type="text"
        style={{
          width: "75%",
        }}
        value={editableTitle}
        onChange={(e) => setEditableTitle(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            onApply(editableTitle); // Submit title on Enter key press
          }
        }}
        className="flex-grow p-2 border rounded"
      />
      <button
        onClick={() => onApply(editableTitle)}
        style={{
          background: "none",
          border: "none",
          cursor: "pointer",
          padding: 0,
          margin: 0,
          boxShadow: "none",
        }}
      >
        <CheckMark /> {/* Use the CheckMark icon here */}
      </button>
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