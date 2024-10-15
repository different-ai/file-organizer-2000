import * as React from "react";
import { TFile } from "obsidian";
import FileOrganizer from "../../index";
import { ClassificationBox } from "./classification-box";
import { FabricClassificationBox } from "./fabric-classification-box";

interface ClassificationBoxProps {
  plugin: FileOrganizer;
  file: TFile | null;
  content: string;
  refreshKey: number;
}

export const ClassificationContainer: React.FC<ClassificationBoxProps> = ({
  plugin,
  file,
  content,
  refreshKey,
}) => {
  return (
    <div className="classification-container space-y-4 mt-3">
      {/* Existing Classification Box */}
      <ClassificationBox
        plugin={plugin}
        file={file}
        content={content}
        refreshKey={refreshKey}
      />
      {plugin.settings.enableFabric && (
        <FabricClassificationBox
          plugin={plugin}
          file={file}
          content={content}
          refreshKey={refreshKey}
        />
      )}
    </div>
  );
};
