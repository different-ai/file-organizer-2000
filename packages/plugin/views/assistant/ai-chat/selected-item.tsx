import React from "react";
import { motion } from "framer-motion";

interface SelectedItemProps {
  item: string;
  prefix: string;
  onClick: () => void;
  onRemove: () => void;
}

export const SelectedItem: React.FC<SelectedItemProps> = ({
  item,
  prefix,
  onClick,
  onRemove,
}) => (
  <motion.div
    className="bg-[--background-secondary] text-[--text-normal] rounded px-2 py-1 text-sm m-1 flex gap-1 min-w-fit h-fit"
    initial={{ opacity: 0, scale: 0.8 }}
    animate={{ opacity: 1, scale: 1 }}
    exit={{ opacity: 0, scale: 0.8 }}
    transition={{ duration: 0.2 }}
  >
    <span
      onClick={onClick}
      className="cursor-pointer"
    >
      {prefix}
      {item}
    </span>
    <div
      onClick={onRemove}
      className="text-[--text-muted] hover:text-[--text-normal] cursor-pointer"
    >
      ×
    </div>
  </motion.div>
);
