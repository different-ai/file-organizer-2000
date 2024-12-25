# ScreenpipeHandler

## Overview
The ScreenpipeHandler is a tool that allows you to retrieve and analyze your Screenpipe activity data. It processes screen recording data and provides insights about your daily activities.

## Usage

### Basic Command
To retrieve your Screenpipe activity, you can use a natural language prompt like:
```
based on my screenpipe activity
```

This will trigger the `getScreenpipeDailySummary` tool in the chat interface.

### Parameters
The handler accepts the following parameters:
- `startTime` (optional): Start time in ISO format
- `endTime` (optional): End time in ISO format

If no times are specified, it will use default time ranges.

### How It Works
1. When triggered, the handler:
   - Fetches daily information using the `getDailyInformation` function
   - Clears existing context
   - Adds new Screenpipe data to the context
   - Returns the results with success/failure status

### Example Response
The handler will show:
- A loading state: "Fetching Screenpipe data..."
- Success state: "Screenpipe data successfully retrieved"
- Error state: "Failed to fetch Screenpipe data"

### Code Reference
The handler is implemented in `packages/plugin/views/ai-chat/tool-handlers/screenpipe-handler.tsx` and is triggered through the chat interface defined in `packages/web/app/api/(newai)/chat/route.ts`.
