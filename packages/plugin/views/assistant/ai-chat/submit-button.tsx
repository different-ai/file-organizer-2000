import React from "react";
import { Button } from "./button";

interface SubmitButtonProps {
  isGenerating: boolean;
  className?: string;
}

export const SubmitButton: React.FC<SubmitButtonProps> = ({
  isGenerating,
  className = "",
}) => {
  return (
    <Button
      type="submit"
      className={`flex-none ml-2 font-bold px-4 flex items-center justify-center h-full ${
        isGenerating
          ? "bg-[--background-modifier-form-field] text-[--text-muted] cursor-not-allowed"
          : "bg-[--interactive-accent] hover:bg-[--interactive-accent-hover] text-[--text-on-accent]"
      } ${className}`}
    >
      {isGenerating ? (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          className="w-5 h-5"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
      ) : (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          className="w-5 h-5"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M14 5l7 7m0 0l-7 7m7-7H3"
          />
        </svg>
      )}
    </Button>
  );
}; 