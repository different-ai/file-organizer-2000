import * as React from "react";
import "./SkeletonLoader.css"; // Add appropriate styles for the skeleton loader

const SkeletonLoader: React.FC<{ width?: string; height?: string }> = ({
  width = "100%",
  height = "1em",
}) => {
  return <div className="skeleton-loader" style={{ width, height }}></div>;
};

export default SkeletonLoader;
