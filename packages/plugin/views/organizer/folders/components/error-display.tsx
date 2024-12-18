import * as React from "react";

interface ErrorDisplayProps {
  message: string;
  onRetry: () => void;
}

export const ErrorDisplay: React.FC<ErrorDisplayProps> = ({ message, onRetry }) => (
  <div className="error-container">
    <p>Error: {message}</p>
    <button onClick={onRetry}>Retry</button>
  </div>
);