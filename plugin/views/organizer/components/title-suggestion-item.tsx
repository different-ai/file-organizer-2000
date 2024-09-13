import * as React from "react";
import { motion } from "framer-motion";

interface TitleSuggestionProps {
  title: string;
  onClick: () => void;
}

export const TitleSuggestion: React.FC<TitleSuggestionProps> = ({ title, onClick }) => (
  <motion.button
    variants={itemVariants}
    whileTap={{ scale: 0.95 }}
    className="title-suggestion"
    onClick={onClick}
  >
    <span>{title}</span>
  </motion.button>
);

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