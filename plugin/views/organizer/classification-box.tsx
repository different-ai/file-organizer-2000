import * as React from "react";
import { TFile } from "obsidian";
import FileOrganizer from "../../index";
import { logMessage } from "../../../utils";

interface ClassificationBoxProps {
  plugin: FileOrganizer;
  file: TFile | null;
  content: string;
  refreshKey: number;
}

export const ClassificationBox: React.FC<ClassificationBoxProps> = ({ plugin, file, content, refreshKey }) => {
  const [templateNames, setTemplateNames] = React.useState<string[]>([]);
  const [selectedTemplateName, setSelectedTemplateName] = React.useState<string | null>(null);
  const [showDropdown, setShowDropdown] = React.useState<boolean>(false);
  const [formatting, setFormatting] = React.useState<boolean>(false);
  const [contentLoadStatus, setContentLoadStatus] = React.useState<'loading' | 'success' | 'error'>('loading');
  const [classificationStatus, setClassificationStatus] = React.useState<'loading' | 'success' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const fetchClassificationAndTemplates = async () => {
      if (!content || !file) {
        setContentLoadStatus('error');
        console.error('No content or file available');
        return;
      }
      
      setContentLoadStatus('loading');
      setClassificationStatus('loading');

      try {
        const fileContent = await plugin.app.vault.read(file);
        if (typeof fileContent !== 'string') {
          throw new Error('File content is not a string');
        }
        logMessage(fileContent, 'fileContent');
        setContentLoadStatus('success');

        const fetchedTemplateNames = await plugin.getTemplateNames();
        setTemplateNames(fetchedTemplateNames);
        logMessage(fetchedTemplateNames, 'fetchedTemplateNames');

        const classifiedAs = await plugin.classifyContentV2(fileContent, fetchedTemplateNames);
        logMessage(classifiedAs, 'classifiedAs');
        
        const selectedClassification = fetchedTemplateNames.find(t => t.toLowerCase() === classifiedAs?.toLowerCase());
        if (selectedClassification) {
          setSelectedTemplateName(selectedClassification);
        } else {
          console.warn('No matching classification found, using empty classification');
          setSelectedTemplateName(null);
        }
        setClassificationStatus('success');
      } catch (error) {
        console.error('Error in fetchClassificationAndTemplates:', error);
        setClassificationStatus('error');
      }
    };
    fetchClassificationAndTemplates();

    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [content, file, plugin, refreshKey]);

  const handleFormat = async (templateName: string) => {
    try {
      setFormatting(true);
      if (!file) throw new Error('No file selected');
      if (!templateName) {
        throw new Error('Invalid template name');
      }
      const fileContent = await plugin.app.vault.read(file);
      if (typeof fileContent !== 'string') {
        throw new Error('File content is not a string');
      }
      const formattingInstruction = await plugin.getTemplateInstructions(templateName);
      await plugin.formatContent({
        file: file,
        content: fileContent,
        formattingInstruction: formattingInstruction,
      });
      setSelectedTemplateName(null);
    } catch (error) {
      console.error('Error in handleFormat:', error);
      setErrorMessage((error as Error).message);
    } finally {
      setFormatting(false);
    }
  };

  const getDisplayText = () => {
    if (selectedTemplateName) {
      return `Format as ${selectedTemplateName}`;
    }
    return "Select template";
  };

  const dropdownTemplates = templateNames.filter(t => t !== selectedTemplateName);

  const renderContent = () => {
    if (contentLoadStatus === 'error' || classificationStatus === 'error') {
      return <div className="text-[--text-error] p-2 rounded-md bg-[--background-modifier-error]">Unable to process the content. Please try again later.</div>;
    }
    if (classificationStatus === 'loading') {
      return <div className="text-[--text-muted] p-2">Classifying content...</div>;
    }
    
    return (
      <div className="flex flex-col space-y-2">
        <div className="relative" ref={dropdownRef}>
          <button
            className="w-full flex items-center justify-between px-3 py-2 bg-[--background-secondary] text-[--text-normal] rounded-md hover:bg-[--background-modifier-hover] transition-colors duration-200"
            onClick={() => setShowDropdown(!showDropdown)}
          >
            <span>{getDisplayText()}</span>
            <svg
              className="w-4 h-4 ml-2"
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
          {showDropdown && (
            <div className="absolute z-10 w-full mt-1 bg-[--background-primary] border border-[--background-modifier-border] rounded-md shadow-lg">
              {dropdownTemplates.length > 0 ? (
                dropdownTemplates.map((templateName, index) => (
                  <div
                    key={index}
                    className="px-3 py-2 cursor-pointer hover:bg-[--background-modifier-hover] text-[--text-normal]"
                    onClick={() => {
                      setSelectedTemplateName(templateName);
                      setShowDropdown(false);
                    }}
                  >
                    {templateName}
                  </div>
                ))
              ) : (
                <div className="px-3 py-2 text-[--text-muted]">
                  No templates available
                </div>
              )}
            </div>
          )}
        </div>
        <button
          className={`px-4 py-2 rounded-md transition-colors duration-200 ${
            !selectedTemplateName || formatting
              ? 'bg-[--background-modifier-border] text-[--text-muted] cursor-not-allowed'
              : 'bg-[--interactive-accent] text-white hover:bg-[--interactive-accent-hover]'
          }`}
          disabled={!selectedTemplateName || formatting}
          onClick={() => selectedTemplateName && handleFormat(selectedTemplateName)}
        >
          {formatting ? "Applying..." : "Apply"}
        </button>
      </div>
    );
  };

  return (
    <div className="bg-[--background-primary-alt] text-[--text-normal] p-4 rounded-lg shadow-md">
      <div className="font-semibold pb-2">User Templates</div>
      {renderContent()}
    </div>
  );
};
