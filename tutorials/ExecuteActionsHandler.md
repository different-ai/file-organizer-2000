# ExecuteActionsHandler

## Overview
The ExecuteActionsHandler is a powerful tool that can analyze file content and perform various actions like tagging, moving to folders, or renaming files based on their content.

## Usage

### Basic Command
The handler is typically triggered after selecting files to process, using a natural language prompt like:
```
rename files with something meaningful
```

This will trigger the `executeActionsOnFileBasedOnPrompt` tool in the chat interface.

### Parameters
The handler accepts:
- `filePaths`: Array of file paths to analyze
- `userPrompt`: Instructions for how to rename/re-tag/re-folder the files

### Actions Available
The handler can perform three types of actions based on the user prompt:
1. **Tags** (triggered by words like "tag" or "label")
   - Recommends and adds tags based on content
2. **Folders** (triggered by words like "folder", "move", or "organize")
   - Suggests and moves files to appropriate folders
3. **Names** (default action)
   - Recommends and applies meaningful names based on content

### How It Works
1. The handler:
   - Analyzes the user prompt to determine the action type
   - Processes each file individually
   - Shows a confirmation button before executing actions
   - Provides visual feedback for each operation

### Example Response
The handler shows:
- Success: "✅ Added tag [tag] to [filename]"
- Info: "ℹ️ No suggestions for [filename]"
- Error: "❌ Error processing [filename]"

### Code Reference
The handler is implemented in `packages/plugin/views/ai-chat/tool-handlers/execute-actions-handler.tsx` and is triggered through the chat interface defined in `packages/web/app/api/(newai)/chat/route.ts`.
