import * as React from "react";
import { Notice, TFile, TFolder } from "obsidian";
import FileOrganizer from "../../index";

interface FabricClassificationBoxProps {
  plugin: FileOrganizer;
  file: TFile | null;
  content: string;
  refreshKey: number;
}

type FabricPattern = {
  name: string;
};

export const FabricClassificationBox: React.FC<FabricClassificationBoxProps> = ({
  plugin,
  file,
  content,
  refreshKey,
}) => {
  const [fabricPatterns, setFabricPatterns] = React.useState<FabricPattern[]>([]);
  const [selectedFabricPattern, setSelectedFabricPattern] = React.useState<FabricPattern | null>(null);
  const [showFabricDropdown, setShowFabricDropdown] = React.useState<boolean>(false);
  const [isFormatting, setIsFormatting] = React.useState<boolean>(false);
  const [loadStatus, setLoadStatus] = React.useState<"loading" | "success" | "error">("loading");
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  const fabricDropdownRef = React.useRef<HTMLDivElement>(null);

  /**
   * Retrieves all folder names from the fabricPatternPath.
   * @returns Array of FabricPattern
   */
  const getFabricPatterns = async (): Promise<FabricPattern[]> => {
    try {
      const patternsPath = plugin.settings.fabricPatternPath;
      await plugin.ensureFolderExists(patternsPath);
      const patternFolder = plugin.app.vault.getAbstractFileByPath(patternsPath);
      
      if (!patternFolder || !(patternFolder instanceof TFolder)) {
        throw new Error(`Fabric patterns directory not found: ${patternsPath}`);
      }

      const folders = patternFolder.children.filter(file => file instanceof TFolder) as TFolder[];
      return folders.map(folder => ({ name: folder.name }));
      
    } catch (error) {
      console.error("Error in getFabricPatterns:", error);
      return [];
    }
  };

  /**
   * Formats content using Fabric structure.
   * @param params Parameters including file, systemContent, and content.
   */
  const formatFabricContent = async (params: {
    file: TFile;
    content: string;
    systemContent: string;
  }): Promise<void> => {
    try {
      new Notice("Formatting content with Fabric...", 3000);
      const response = await fetch(`${plugin.getServerUrl()}/api/fabric-classify/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${plugin.settings.API_KEY}`,
        },
        body: JSON.stringify({
          content: params.content,
          systemContent: params.systemContent,
          enableFabric: true,
        }),
      });

      if (!response.ok) {
        throw new Error(`Fabric formatting failed with status: ${response.status}`);
      }

      const data = await response.json();
      await plugin.app.vault.modify(params.file, data.formattedContent);
      new Notice("Content formatted successfully with Fabric.", 3000);
    } catch (error) {
      console.error("Error in formatFabricContent:", error);
      new Notice(`Formatting failed: ${(error as Error).message}`, 5000);
    }
  };

  React.useEffect(() => {
    const fetchFabricPatterns = async () => {
      if (!content || !file) {
        setLoadStatus("error");
        console.error("No content or file available for Fabric classification");
        return;
      }

      setLoadStatus("loading");

      try {
        const patterns = await getFabricPatterns();

        if (!patterns.length) {
          throw new Error("No Fabric patterns found");
        }

        setFabricPatterns(patterns);
        setLoadStatus("success");
      } catch (error) {
        console.error("Error fetching Fabric patterns:", error);
        setLoadStatus("error");
        setFabricPatterns([]);
      }
    };

    fetchFabricPatterns();

    const handleClickOutside = (event: MouseEvent) => {
      if (
        fabricDropdownRef.current &&
        !fabricDropdownRef.current.contains(event.target as Node)
      ) {
        setShowFabricDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [content, file, plugin, refreshKey]);

  const handleApplyFabric = async (pattern: FabricPattern) => {
    try {
      setIsFormatting(true);
      if (!file) throw new Error("No file selected");
      if (!pattern || typeof pattern.name !== "string") {
        throw new Error("Invalid Fabric pattern");
      }

      const patternsPath = plugin.settings.fabricPatternPath;
      const systemFilePath = `${patternsPath}/${pattern.name}/system.md`;
      const systemFile = plugin.app.vault.getAbstractFileByPath(systemFilePath) as TFile;

      if (!systemFile) {
        throw new Error(`System file not found for pattern: ${pattern.name}`);
      }

      const systemContent = await plugin.app.vault.read(systemFile);
      const fileContent = await plugin.app.vault.read(file);

      await formatFabricContent({
        file,
        content: fileContent,
        systemContent,
      });

      setSelectedFabricPattern(null);
    } catch (error) {
      console.error("Error in handleApplyFabric:", error);
      setErrorMessage((error as Error).message);
    } finally {
      setIsFormatting(false);
    }
  };

  const getFabricDisplayText = () => {
    if (selectedFabricPattern) {
      return `Format as ${selectedFabricPattern.name}`;
    }
    return "Select Fabric Pattern";
  };

  const availableFabricPatterns = fabricPatterns.filter(
    t => t.name !== selectedFabricPattern?.name
  );

  const renderFabricContent = () => {
    if (loadStatus === "error") {
      return (
        <div className="error-message">
          Unable to load Fabric patterns. Please check the configuration.
        </div>
      );
    }
    if (loadStatus === "loading") {
      return <div className="loading-message">Loading Fabric patterns...</div>;
    }

    return (
      <div className="fabric-pattern-selection-container">
        <div className="split-button-container" ref={fabricDropdownRef}>
          <button
            className=""
            style={{ boxShadow: "none" }}
            onClick={() => setShowFabricDropdown(!showFabricDropdown)}
          >
            <span className="">{getFabricDisplayText()}</span>
            <svg
              className="split-button-arrow"
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M6 9L12 15L18 9"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
          {showFabricDropdown && (
            <div className={`templates-dropdown-menu ${showFabricDropdown ? "show" : ""}`}>
              {availableFabricPatterns.length > 0 ? (
                availableFabricPatterns.map((pattern, index) => (
                  <div
                    key={index}
                    className="dropdown-item"
                    onClick={() => {
                      setSelectedFabricPattern(pattern);
                      setShowFabricDropdown(false);
                    }}
                  >
                    {pattern.name}
                  </div>
                ))
              ) : (
                <div className="dropdown-item">No Fabric patterns available</div>
              )}
            </div>
          )}
        </div>
        <button
          className="apply-pattern-button"
          disabled={!selectedFabricPattern || isFormatting}
          onClick={() =>
            selectedFabricPattern && handleApplyFabric(selectedFabricPattern)
          }
        >
          {isFormatting ? "Applying..." : "Apply"}
        </button>
      </div>
    );
  };

  return (
    <div className="fabric-assistant-section classification-section">
      {renderFabricContent()}
      {errorMessage && <div className="error-message">{errorMessage}</div>}
    </div>
  );
};
