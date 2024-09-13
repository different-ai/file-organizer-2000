import * as React from "react";
import { motion } from "framer-motion";

export const SkeletonLoader: React.FC = () => (
  <motion.div
    className=""
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
      flexDirection: "column",
      gap: "12px",
      padding: "16px",
    }}
  >
    {[1, 2, 3].map(i => (
      <div
        key={i}
        className="skeleton-row"
        style={{
          display: "flex",
          gap: "8px",
        }}
      >
        <SkeletonItem width="60%" height="24px" />
      </div>
    ))}
  </motion.div>
);

const SkeletonItem: React.FC<{ width: string; height: string }> = ({
  width,
  height,
}) => (
  <div
    className=""
    style={{
      opacity: 0.5,
      width,
      height,
      backgroundColor: "#e0e0e0",
      borderRadius: "4px",
    }}
  />
);
