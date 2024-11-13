import * as React from "react";

interface SectionHeaderProps {
  text: string;
  icon?: string;
}

export const SectionHeader: React.FC<SectionHeaderProps> = ({ text, icon }) => {
  return (
    <h6 className="text-sm font-medium ">
      {icon && <span className="assistant-section-icon">{icon}</span>}
      {text}
    </h6>
  );
};