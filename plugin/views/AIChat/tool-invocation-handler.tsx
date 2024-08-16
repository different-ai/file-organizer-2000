import React from "react";
import { motion } from "framer-motion";
import styled from "@emotion/styled";
interface ToolInvocationHandlerProps {
    toolInvocation: any; // Replace 'any' with a more specific type if available
    addToolResult: (result: { toolCallId: string; result: string }) => void;
  }

const ToolInvocationWrapper = styled(motion.div)`
  background-color: #f0f4f8;
  border-radius: 8px;
  padding: 12px 16px;
  margin: 8px 0;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
`;

const ToolTitle = styled.h4`
  margin: 0 0 8px;
  color: #2c3e50;
  font-size: 14px;
  font-weight: 600;
`;

const ToolContent = styled.div`
  font-size: 14px;
  color: #34495e;
`;

const StyledButton = styled.button`
  margin-right: 8px;
  padding: 6px 12px;
  font-size: 12px;
  background-color: #3498db;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.2s ease;

  &:hover {
    background-color: #2980b9;
  }
`;

function toolInvocationHandler({ toolInvocation, addToolResult }: ToolInvocationHandlerProps) {
  const toolCallId = toolInvocation.toolCallId;
  const handleAddResult = (result: string) => addToolResult({ toolCallId, result });

  const getToolTitle = (toolName: string) => {
    switch (toolName) {
      case "getNotesForDateRange": return "Fetching Notes";
      case "searchNotes": return "Searching Notes";
      case "askForConfirmation": return "Confirmation Required";
      case "getYouTubeTranscript": return "YouTube Transcript";
      case "modifyCurrentNote": return "Note Modification";
      case "getLastModifiedFiles": return "Recent File Activity";
      default: return "Tool Invocation";
    }
  };

  const renderContent = () => {
    switch (toolInvocation.toolName) {
      case "getNotesForDateRange":
        return (
          <ToolContent>
            {"result" in toolInvocation
              ? `All notes modified within the following time period were added to the AI context: ${toolInvocation.result}`
              : "Retrieving your notes for the specified time period..."}
          </ToolContent>
        );

      case "searchNotes":
        return (
          <ToolContent>
            {"result" in toolInvocation
              ? `Here's what I found: ${toolInvocation.result}`
              : "Scouring your notes for relevant information..."}
          </ToolContent>
        );

      case "askForConfirmation":
        return (
          <ToolContent>
            <p>{toolInvocation.args.message}</p>
            {"result" in toolInvocation ? (
              <b>{toolInvocation.result}</b>
            ) : (
              <div>
                <StyledButton onClick={() => handleAddResult("Yes")}>
                  Confirm
                </StyledButton>
                <StyledButton onClick={() => handleAddResult("No")}>
                  Cancel
                </StyledButton>
              </div>
            )}
          </ToolContent>
        );

      case "getYouTubeTranscript":
        return (
          <ToolContent>
            {"result" in toolInvocation
              ? toolInvocation.result.error
                ? `Oops! Couldn't fetch the transcript: ${toolInvocation.result.error}`
                : "YouTube transcript successfully retrieved"
              : "Fetching the video transcript..."}
          </ToolContent>
        );

      case "modifyCurrentNote":
        return (
          <ToolContent>
            {"result" in toolInvocation
              ? `Changes applied: ${toolInvocation.result}`
              : "Applying changes to your note..."}
          </ToolContent>
        );

      case "getLastModifiedFiles":
        if ("result" in toolInvocation) {
          const count = toolInvocation.result;
          
          if (count) {
            return (
              <ToolContent>
                You've modified {count} file{count > 1 ? 's' : ''} recently
              </ToolContent>
            );
          }

          return (
            <ToolContent>
              Hmm, I couldn't determine your recent file activity
            </ToolContent>
          );
        } else {
          return <ToolContent>Checking your recent file activity...</ToolContent>;
        }

      default:
        return null;
    }
  };

  return (
    <ToolInvocationWrapper
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <ToolTitle>{getToolTitle(toolInvocation.toolName)}</ToolTitle>
      {renderContent()}
    </ToolInvocationWrapper>
  );
}

export default toolInvocationHandler;