import * as React from "react";

interface SectionHeaderProps {
  text: string;
  icon?: string;
}

export const SectionHeader: React.FC<SectionHeaderProps> = ({ text, icon }) => {
  return (
    <h6 className="assistant-section-header">
      {icon && <span className="assistant-section-icon">{icon}</span>}
      {text}
    </h6>
  );
};