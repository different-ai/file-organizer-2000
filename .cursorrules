

This works like this

./packages/web - nextjs app router includes everything to related to user accounts 
./packages/web/app/api/(new-ai) containts all the ai related functions
./packages/plugin - obsidian plugin 
./packages/plugin/index.ts - the main file for the plugin

This project uses pnpm




core way the app works:
- inbox (a special folder in the vault, which is on the fs)
- the inbox folder is processed by the plugin, which will move the files to the correct folder based on the classification
-  there's an ai chat that has access to a whole lot of functioncals be used to chat with context of files and to do certain actions as defined in ./packages/web/app/api/(new-ai)/tools.ts



hyprqrl Logo
Note Companion for Obsidian
Your AI-powered assistant that turns scattered notes into actionable knowledge.

Start 7-Day Free Trial
Meet Your All-in-One Workflow Buddy
Inbox
Instantly organize any dragged-and-dropped file. Note Companion automatically detects relevant tags and suggests the best folder or location.

Meetings
Supercharge your meeting notes using ScreenPipe, which continuously records your conversation. Tap "Enhance Meeting Note" and watch as it merges the last few minutes of discussion with your current file for perfectly contextualized notes.

Chat
Chat directly with your notes and bring other documents or folders into the conversation with a simple @ mention. Ask Note Companion to modify text, add summaries, rename files, or even split your notes—all in real time.

Why Note Companion?
Automated Organization
No more manual tagging or folder wrangling. Let AI do the heavy lifting.

Instant Insight
Seamlessly merge new discussions or files with existing notes, so everything stays updated and easy to find.

Powerful Editing Tools
Rename, split, or refine notes with a quick command.

Deep Context
AI suggestions factor in the content of your entire vault, ensuring you always get the most relevant tags and folders.

See it in Action
Experience how Note Companion transforms your workflow






📝 team-sync-notes.md
# Team Sync - Product Review
## Meeting Details
**Date**: March 15, 2024**Attendees**: John, Sarah, Mike, Lisa
## Key Discussions
1. **Mobile App Redesign Priority**
- User engagement metrics show increasing mobile usage - Need to focus on improving mobile experience - Adopt mobile-first approach
2. **User Feedback Analysis**
- Navigation complexity issues identified - Performance concerns on older devices - Simplified navigation structure proposed
## Action Items
- [ ] Schedule follow-up with design team- [x] Share meeting notes with stakeholders- [ ] Update project timeline- [ ] Conduct detailed user feedback review
## Next Steps
1. Implement mobile-first approach2. Redesign navigation structure3. Plan performance optimization sprint
## Related Notes
[[Q4 Planning]][[Mobile App Redesign]][[User Feedback Q1 2024]]
## Tags
#product#mobile#q4-2024#user-feedback
Organizer
Inbox
Meetings
Chat
🎯
AI-Powered File Organization
Your personal file librarian that understands context

Turn messy notes into clean, structured docs
Auto-tag everything based on content
Split long docs into atomic notes
🤖
AI Templates
Apply Template
Current Template:
Meeting Notes Pro
This template will:

Structure content with clear headings
Extract and format action items
Highlight key decisions
Add metadata (date, attendees)
🏷️
AI Tags
3 suggestions
#mobile-app
#user-feedback
#q4-planning
Tags suggested based on note content analysis

📁
Suggested Location
Move
Projects/Mobile App/Meetings
Based on content similarity and existing structure

✂️
Atomic Notes
4 chunks detected
Suggested splits:
Mobile App Redesign Requirements
Q4 Timeline Updates
User Feedback Analysis
Performance Optimization Plan
Split into Atomic Notes
Simple, Flexible Pricing
Whether you're a solo note-taker or a power user looking for advanced features, we've got you covered.

Self-Hosted
Free
Ultimate privacy and control

Ultimate privacy
Use your own AI models
Community support
Source code access
Get Started
Subscription
$15
/month
or $119/year (save ~33%)
No setup required

No setup required
Managed API keys
~1000 files per month
Premium support
Regular updates
Start Free Trial
Most Popular
Pay Once
$300
Lifetime access with full control

One-time payment
Lifetime updates
Multiple licenses
Premium support
Use your own API keys
Get Lifetime Access
Ready to revolutionize your note-taking?
Get Note Companion and enjoy a 7-day free trial on any paid plan. Bring order to your Obsidian vault. Stop wrestling with messy notes and let AI handle the tedious tasks—so you can focus on what really matters.

Start Free Trial
Different AI Inc - Privacy-first AI solutions




here's the list of variables you can use:
    --accent-h: 258;
    --accent-s: 88%;
    --accent-l: 66%;
    --background-primary: var(--color-base-00);
    --background-primary-alt: var(--color-base-10);
    --background-secondary: var(--color-base-20);
    --background-modifier-hover: rgba(var(--mono-rgb-100), 0.075);
    --background-modifier-active-hover: hsla(var(--interactive-accent-hsl), 0.15);
    --background-modifier-border: var(--color-base-30);
    --background-modifier-border-hover: var(--color-base-35);
    --background-modifier-border-focus: var(--color-base-40);
    --background-modifier-success-rgb: var(--color-green-rgb);
    --background-modifier-success: var(--color-green);
    --background-modifier-message: rgba(0, 0, 0, 0.9);
    --background-modifier-form-field: var(--color-base-00);
    --text-normal: var(--color-base-100);
    --text-muted: var(--color-base-70);
    --text-faint: var(--color-base-50);
    --text-on-accent: white;
    --text-on-accent-inverted: black;
    --text-warning: var(--color-orange);
    --text-success: var(--color-green);
    --text-selection: hsla(var(--color-accent-hsl), 0.2);
    --text-highlight-bg-rgb: 255, 208, 0;
    --text-highlight-bg: rgba(var(--text-highlight-bg-rgb), 0.4);
    --text-accent: var(--color-accent);
    --text-accent-hover: var(--color-accent-2);
    --interactive-normal: var(--color-base-00);
    --interactive-hover: var(--color-base-10);
    --interactive-accent-hsl: var(--color-accent-hsl);
    --interactive-accent: var(--color-accent-1);
    --interactive-accent-hover: var(--color-accent-2);




	•	Access to shadcn/ui components library.
	•	Prioritize: Ease of Use > Aesthetics > Performance.
	•	Use Tailwind CSS for utility-first styling.

Recommended Libraries and Tools:

	1.	State Management:
	•	React Context API for simple state needs.
	•	Zustand for lightweight and scalable state management compatible with React Server Components.
	2.	Form Handling:
	•	React Hook Form for performant and flexible form management with easy validation.
	3.	Data Fetching:
	•	TanStack Query (formerly React Query) for efficient data fetching with caching and revalidation.
	4.	Authentication:
	•	Implement authentication using Clerk.
	5.	Animations:
	•	Framer Motion for smooth animations and transitions.
	6.	Icons:
	•	Use Lucide React for a collection of beautiful open-source icons.

AI Integration with Vercel AI SDK:

	•	Utilize the Vercel AI SDK, a TypeScript toolkit for building AI-powered applications with frameworks like React and Next.js.
	•	Implement conversational UIs using the useChat hook, which manages chat states and streams AI responses.

Using Tools with useChat and streamText:

	•	Types of Tools:
	•	Automatically executed server-side tools.
	•	Automatically executed client-side tools.
	•	User-interactive tools requiring confirmation dialogs.
	•	Workflow:
	1.	User inputs a message in the chat UI.
	2.	Message is sent to the API route.
	3.	Language model generates tool calls via streamText.
	4.	Tool calls are forwarded to the client.
	5.	Server-side tools execute and return results to the client.
	6.	Client-side tools auto-execute using the onToolCall callback.
	7.	Interactive tools display in the UI, results managed via toolInvocations.
	8.	After interactions, use addToolResult to include the result in the chat.
	9.	If tool calls exist in the last message and all results are available, the client resends messages to the server for further processing.
	•	Note: Set maxSteps to a value greater than 1 in useChat options to enable multiple iterations (default is disabled for compatibility).

Example Implementation:

	•	API Route (app/api/chat/route.ts):

import { openai } from '@ai-sdk/openai';
import { streamText } from 'ai';
import { z } from 'zod';

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

export async function POST(req: Request) {
  const { messages } = await req.json();

  const result = await streamText({
    model: openai('gpt-4o'),
    messages,
    tools: {
      // Server-side tool with execute function:
      getWeatherInformation: {
        description: 'Show the weather in a given city to the user.',
        parameters: z.object({ city: z.string() }),
        execute: async ({ city }: { city: string }) => {
          const weatherOptions = ['sunny', 'cloudy', 'rainy', 'snowy', 'windy'];
          return `${city} is currently ${weatherOptions[Math.floor(Math.random() * weatherOptions.length)]}.`;
        },
      },
      // Client-side tool initiating user interaction:
      askForConfirmation: {
        description: 'Ask the user for confirmation.',
        parameters: z.object({
          message: z.string().describe('The message to ask for confirmation.'),
        }),
      },
      // Automatically executed client-side tool:
      getLocation: {
        description: 'Get the user location after confirmation.',
        parameters: z.object({}),
      },
    },
  });

  return result.toDataStreamResponse();
}


	•	Client-Side Page (app/page.tsx):

'use client';

import { ToolInvocation } from 'ai';
import { Message, useChat } from 'ai/react';
import { pipeline } from 'stream'
import { PlaySquareIcon } from 'lucide-react'

export default function Chat() {
  const {
    messages,
    input,
    handleInputChange,
    handleSubmit,
    addToolResult,
  } = useChat({
    maxSteps: 5,

    // Handle automatically executed client-side tools:
    async onToolCall({ toolCall }) {
      if (toolCall.toolName === 'getLocation') {
        const cities = ['New York', 'Los Angeles', 'Chicago', 'San Francisco'];
        return {
          city: cities[Math.floor(Math.random() * cities.length)],
        };
      }
    },
  });

  return (
    <>
      {messages?.map((m: Message) => (
        <div key={m.id}>
          <strong>{m.role}:</strong> {m.content}
          {m.toolInvocations?.map((toolInvocation: ToolInvocation) => {
            const toolCallId = toolInvocation.toolCallId;
            const addResult = (result: string) =>
              addToolResult({ toolCallId, result });

            // Render confirmation tool (client-side with user interaction)
            if (toolInvocation.toolName === 'askForConfirmation') {
              return (
                <div key={toolCallId}>
                  {toolInvocation.args.message}
                  <div>
                    {'result' in toolInvocation ? (
                      <b>{toolInvocation.result}</b>
                    ) : (
                      <>
                        <button onClick={() => addResult('Yes')}>Yes</button>
                        <button onClick={() => addResult('No')}>No</button>
                      </>
                    )}
                  </div>
                </div>
              );
            }

            // Display results of other tools
            return 'result' in toolInvocation ? (
              <div key={toolCallId}>
                <em>Tool ({toolInvocation.toolName}):</em> {toolInvocation.result}
              </div>
            ) : (
              <div key={toolCallId}>
                <em>Executing {toolInvocation.toolName}...</em>
              </div>
            );
          })}
          <br />
        </div>
      ))}

      <form onSubmit={handleSubmit}>
        <input value={input} onChange={handleInputChange} placeholder="Type your message..." />
      </form>
    </>
  );
}



Additional Notes:

	•	Ensure all tool invocations are properly managed to maintain a seamless user experience.
	•	Regularly update dependencies and libraries to their latest versions for improved performance and security.
	•	Test the chatbot thoroughly to handle edge cases and unexpected user inputs.

This revised prompt organizes the information more clearly, making it easier to understand and follow. It highlights key project guidelines, structures, and code examples, providing a comprehensive overview for anyone involved in the development process.


## pipeline

We have an inbox that processes files. 

The process happens in these steps:
- preprocess : trim content  | check if we support file type | check if we have a license
- extract (ai): extract text from file, we have a function in the plugin/index.ts for that
- classify (ai): classify the file, we have a function in the plugin/index.ts for that
- tag (ai): tag the file, we have a function in the plugin/index.ts for that
- format (ai): format the file, we have a function in the plugin/index.ts for that
- move: move the file to the correct folder, we have a function in the plugin/index.ts for that


each step should be logged in the record manager, and we should record the start and end of each step. 

all the ai steps are two folds one api call to get the llm recommendations
and one call to apply the recommendation. add tag after tagging , move file after folder recommendation, rename file after naming

when you classify apply a tag to the document there's append tag funciton on plugin 
only format if 1. there's a classification 2. there's no tag with the classification presetn



# Tool Calling

Tools are objects that can be invoked by the model to perform specific tasks. AI SDK Core tools consist of three key elements:

1. **Description**: Optional. Describes the tool's purpose and influences when it is selected.
2. **Parameters**: A Zod schema or JSON schema that defines the tool's parameters. Used to validate tool calls.
3. **Execute**: An optional async function that processes tool calls and returns a result of type `RESULT`.

## Defining Tools

Use the `tool` helper function to define tools:

```javascript
import { z } from 'zod';
import { generateText, tool } from 'ai';

const result = await generateText({
  model: yourModel,
  tools: {
    weather: tool({
      description: 'Get the weather in a location',
      parameters: z.object({
        location: z.string().describe('The location to get the weather for'),
      }),
      execute: async ({ location }) => ({
        location,
        temperature: 72 + Math.floor(Math.random() * 21) - 10,
      }),
    }),
  },
  prompt: 'What is the weather in San Francisco?',
});

When a tool is used, the process is called a tool call, and its output is the tool result.

Multi-Step Calls

Enable multi-step calls with the maxSteps setting in generateText or streamText. Each step can include a text generation or tool call, looping until no further calls are needed or the maximum number of steps is reached.

Example

import { z } from 'zod';
import { generateText, tool } from 'ai';

const { text, steps } = await generateText({
  model: yourModel,
  tools: {
    weather: tool({
      description: 'Get the weather in a location',
      parameters: z.object({
        location: z.string().describe('The location to get the weather for'),
      }),
      execute: async ({ location }) => ({
        location,
        temperature: 72 + Math.floor(Math.random() * 21) - 10,
      }),
    }),
  },
  maxSteps: 5,
  prompt: 'What is the weather in San Francisco?',
});

Accessing Steps

Retrieve intermediate tool calls and results using the steps property:

const allToolCalls = steps.flatMap(step => step.toolCalls);

onStepFinish Callback

Use onStepFinish to execute logic after each step:

const result = await generateText({
  onStepFinish({ text, toolCalls, toolResults }) {
    // Save chat history or log usage
  },
});

Tool Choice

Control tool selection with the toolChoice setting:
	•	auto (default): Model decides when and which tool to use.
	•	required: Model must call a tool.
	•	none: Model must not use tools.
	•	{ type: 'tool', toolName: string }: Model must call the specified tool.

Example

const result = await generateText({
  tools: {
    weather: tool({
      description: 'Get the weather in a location',
      parameters: z.object({ location: z.string() }),
      execute: async ({ location }) => ({ location, temperature: 72 }),
    }),
  },
  toolChoice: 'required',
  prompt: 'What is the weather in San Francisco?',
});

Error Handling

AI SDK handles the following tool-call errors:
	1.	NoSuchToolError: Tool not defined in the tools object.
	2.	InvalidToolArgumentsError: Invalid arguments for the tool’s parameters.
	3.	ToolExecutionError: Error during tool execution.

Handling Errors

try {
  const result = await generateText({
    // ...
  });
} catch (error) {
  if (NoSuchToolError.isInstance(error)) {
    // Handle missing tool
  } else if (InvalidToolArgumentsError.isInstance(error)) {
    // Handle invalid arguments
  } else if (ToolExecutionError.isInstance(error)) {
    // Handle execution error
  }
}

Tool Call Repair

Use experimental_repairToolCall to attempt repairs for invalid tool calls:

const result = await generateText({
  experimental_repairToolCall: async ({ toolCall, parameterSchema }) => {
    // Repair logic here
  },
});

Active Tools

Limit active tools using experimental_activeTools:

const { text } = await generateText({
  tools: myToolSet,
  experimental_activeTools: ['firstTool'],
});

Types

Ensure type safety with helper types:

import { CoreToolCallUnion, CoreToolResultUnion } from 'ai';

type MyToolCall = CoreToolCallUnion<typeof myToolSet>;
type MyToolResult = CoreToolResultUnion<typeof myToolSet>;

