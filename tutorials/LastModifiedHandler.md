# LastModifiedHandler

## Overview
The LastModifiedHandler allows you to retrieve recently modified files from your vault. It's particularly useful for finding files you've recently worked on.

## Usage

### Basic Command
To get your recently modified files, use a natural language prompt like:
```
get my last 7 files
```

This will trigger the `getLastModifiedFiles` tool in the chat interface.

### Parameters
The handler accepts one parameter:
- `count`: The number of last modified files to retrieve

### How It Works
1. When triggered, the handler:
   - Gets all markdown files from the vault
   - Sorts them by modification time
   - Retrieves the specified number of most recent files
   - Adds the files to the context for further operations

### Example Response
The handler will show:
- Loading state: "Fetching last modified files..."
- Success state: "Found X recently modified files"
- Error state: "No recently modified files found"

### File Information Retrieved
For each file, the handler returns:
- Title (basename)
- Content
- Path
- Last modified timestamp

### Code Reference
The handler is implemented in `packages/plugin/views/ai-chat/tool-handlers/last-modified-handler.tsx` and is triggered through the chat interface defined in `packages/web/app/api/(newai)/chat/route.ts`.
