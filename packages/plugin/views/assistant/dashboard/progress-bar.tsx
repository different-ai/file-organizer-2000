import React from "react";
import { Progress } from "@/components/ui/progress";

interface ProgressBarProps {
  value: number; // 0 to 100
}

/**
 * Simple progress indicator
 */
export function ProgressBar({ value }: ProgressBarProps) {
  return (
    <Progress value={value} className="w-full" />
  );
} 