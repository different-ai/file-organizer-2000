import * as React from "react";

interface EmptyStateProps {
  message: string;
  showRefresh?: boolean;
  onRefresh?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ message, showRefresh = false, onRefresh }) => {
  return (
    <div className="empty-state">
      <div className="empty-state-icon">📝</div>
      <p className="empty-state-message">{message}</p>
      {showRefresh && onRefresh && (
        <button className="empty-state-refresh" onClick={onRefresh}>
          Refresh
        </button>
      )}
    </div>
  );
};