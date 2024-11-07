import * as React from "react";

interface EmptyStateProps {
  message: string;
  showRefresh?: boolean;
  onRefresh?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ message, showRefresh = false, onRefresh }) => {
  return (
    <div className="flex flex-col items-center justify-center p-6 bg-background-primary-alt rounded-lg ">
      <div className="text-6xl mb-4 text-accent">📝</div>
      <p className="text-lg text-text-muted mb-4">{message}</p>
      
    </div>
  );
};