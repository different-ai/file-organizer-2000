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
    <div className="classification-container ">
      {/* Existing Classification Box */}
      <h2 className="tw-text-2xl">Transform</h2>

      <ClassificationBox
        plugin={plugin}
        file={file}
        content={content}
        refreshKey={refreshKey}
      />
      <h4 >Fabric</h4>
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
