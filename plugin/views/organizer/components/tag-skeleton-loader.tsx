import * as React from "react";
import { motion } from "framer-motion";

export const TagSkeletonLoader: React.FC = () => (
  <motion.div
    className="tags-container"
    initial={{ opacity: 0 }}
    animate={{
      opacity: [0.1, 0.4, 0.3],
    }}
    transition={{
      duration: 1.5,
      repeat: Infinity,
      ease: "easeInOut",
    }}
    style={{
      display: "flex",
      flexWrap: "wrap",
      gap: "8px",
    }}
  >
    {[1, 2, 3, 4, 5].map(i => (
      <SkeletonTag key={i} />
    ))}
  </motion.div>
);

const SkeletonTag: React.FC = () => (
  <motion.div
    className="skeleton-tag"
    style={{
      width: "60px",
      height: "24px",
      backgroundColor: "#e0e0e0",
      borderRadius: "12px",
    }}
  />
);