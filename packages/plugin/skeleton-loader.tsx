import * as React from "react";

const SkeletonLoader: React.FC<{ width?: string; height?: string }> = ({
  width = "100%",
  height = "1em",
}) => {
  return <div className="skeleton-loader" style={{ width, height }}></div>;
};

export default SkeletonLoader;
