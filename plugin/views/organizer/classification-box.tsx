import * as React from "react";
import { TFile } from "obsidian";
import FileOrganizer from "../../index";

interface ClassificationBoxProps {
  plugin: FileOrganizer;
  file: TFile | null;
  content: string;
  refreshKey: number;
}

export interface Classification {
  type: string;
  formattingInstruction: string;
}

interface Template {
  type: string;
  formattingInstruction: string;
}

export const ClassificationBox: React.FC<ClassificationBoxProps> = ({ plugin, file, content, refreshKey }) => {
  const [classification, setClassification] = React.useState<Classification | null>(null);
  const [templates, setTemplates] = React.useState<Template[]>([]);
  const [selectedTemplate, setSelectedTemplate] = React.useState<Template | null>(null);
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
        setContentLoadStatus('success');

        const fetchedTemplates = await plugin.getTemplates();
        if (!Array.isArray(fetchedTemplates) || !fetchedTemplates.every(t => typeof t.type === 'string' && typeof t.formattingInstruction === 'string')) {
          throw new Error('Invalid templates data');
        }
        setTemplates(fetchedTemplates);

        const templateNames = fetchedTemplates.map(t => t.type);
        const classifiedType = await plugin.classifyContentV2(fileContent, templateNames);
        
        const selectedClassification = fetchedTemplates.find(t => t.type.toLowerCase() === classifiedType.toLowerCase());
        if (selectedClassification) {
          setClassification(selectedClassification);
          setSelectedTemplate(selectedClassification);
        } else {
          console.warn('No matching classification found, using empty classification');
          setClassification(null);
          setSelectedTemplate(null);
        }
        setClassificationStatus('success');
      } catch (error) {
        console.error('Error in fetchClassificationAndTemplates:', error);
        setClassificationStatus('error');
        setClassification(null);
        setSelectedTemplate(null);
        setTemplates([]);
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

  const handleFormat = async (template: Template) => {
    try {
      setFormatting(true);
      if (!file) throw new Error('No file selected');
      if (!template || typeof template.type !== 'string' || typeof template.formattingInstruction !== 'string') {
        throw new Error('Invalid template');
      }
      const fileContent = await plugin.app.vault.read(file);
      if (typeof fileContent !== 'string') {
        throw new Error('File content is not a string');
      }
      await plugin.formatContent({
        file: file,
        content: fileContent,
        formattingInstruction: template.formattingInstruction,
      });
      setClassification(template);
      setSelectedTemplate(null);
    } catch (error) {
      console.error('Error in handleFormat:', error);
      setErrorMessage((error as Error).message);
    } finally {
      setFormatting(false);
    }
  };

  const getDisplayText = () => {
    if (selectedTemplate) {
      return `Format as ${selectedTemplate.type}`;
    }
    return "Select template";
  };

  const dropdownTemplates = templates.filter(t => t.type !== selectedTemplate?.type);

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
                dropdownTemplates.map((template, index) => (
                  <div
                    key={index}
                    className="px-3 py-2 cursor-pointer hover:bg-[--background-modifier-hover] text-[--text-normal]"
                    onClick={() => {
                      setSelectedTemplate(template);
                      setShowDropdown(false);
                    }}
                  >
                    {template.type}
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
            !selectedTemplate || formatting
              ? 'bg-[--background-modifier-border] text-[--text-muted] cursor-not-allowed'
              : 'bg-[--interactive-accent] text-white hover:bg-[--interactive-accent-hover]'
          }`}
          disabled={!selectedTemplate || formatting}
          onClick={() => selectedTemplate && handleFormat(selectedTemplate)}
        >
          {formatting ? "Applying..." : "Apply"}
        </button>
      </div>
    );
  };

  return (
    <div className="bg-[--background-primary-alt] text-[--text-normal] p-4 rounded-lg shadow-md">
      {renderContent()}
    </div>
  );
};
