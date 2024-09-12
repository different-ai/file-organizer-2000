import * as React from "react";

interface RefreshButtonProps {
  onRefresh: () => void;
}

export const RefreshButton: React.FC<RefreshButtonProps> = ({ onRefresh }) => {
  return (
    <button className="refresh-button" onClick={onRefresh}>
      Refresh
    </button>
  );
};