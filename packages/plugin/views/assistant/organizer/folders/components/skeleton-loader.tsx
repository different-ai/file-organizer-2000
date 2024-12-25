import * as React from "react";

interface SkeletonLoaderProps {
  count: number;
  rows: number;
  width: string;
}

export const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({ count, rows, width }) => (
  <div>
    {Array.from({ length: count }).map((_, index) => (
      <div key={index} className="skeleton-row" style={{ width }}>
        {Array.from({ length: rows }).map((__, idx) => (
          <div key={idx} className="skeleton-cell" />
        ))}
      </div>
    ))}
  </div>
);