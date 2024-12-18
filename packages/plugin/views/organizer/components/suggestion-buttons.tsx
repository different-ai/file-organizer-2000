import * as React from "react";
import { motion } from "framer-motion";

// Base Folder Button Component
const BaseFolderButton: React.FC<{
  folder: string;
  onClick: (folder: string) => void;
  className?: string;
  score?: number;
  reason?: string;
}> = ({ folder, onClick, className, score, reason }) => (
  <motion.button
    className={`px-3 py-1 rounded-md transition-colors duration-200 shadow-none ${className}`}
    onClick={() => onClick(folder)}
    initial={{ opacity: 0, scale: 0.8 }}
    animate={{ opacity: 1, scale: 1 }}
    exit={{ opacity: 0, scale: 0.8 }}
    transition={{ duration: 0.2 }}
    title={`Score: ${score}, Reason: ${reason}`}
  >
    {folder}
  </motion.button>
);

// Existing Folder Button Component
export const ExistingFolderButton: React.FC<{
  folder: string;
  onClick: (folder: string) => void;
  score: number;
  reason: string;
}> = props => (
  <BaseFolderButton
    {...props}
    className="bg-[--background-secondary] text-[--text-normal] hover:bg-[--interactive-accent] hover:text-[--text-on-accent] border border-solid border-[--background-modifier-border]"
  />
);

// New Folder Button Component
export const NewFolderButton: React.FC<{
  folder: string;
  onClick: (folder: string) => void;
  score: number;
  reason: string;
}> = props => (
  <BaseFolderButton
    {...props}
    className="bg-[--background-secondary] text-[--text-normal] hover:bg-[--interactive-accent] hover:text-[--text-on-accent] border border-dashed border-[--text-muted]"
  />
); 