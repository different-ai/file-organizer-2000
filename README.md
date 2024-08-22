# AI File Organizer 2000

An Obsidian plugin that uses AI to keep your files organized. It tags, renames, and moves files to the right folders in your vault. Plus, you can create AI templates to format your notes using custom prompts and obtain transcriptions of your audio files.

🆕 Now also includes the most powerful AI Chat for Obsidian.



### Features

- **Organization:** Automatically suggests file names, tags and folders for your notes & more.

- **AI Chat**: The most powerful chat for Obsidian 🦾 Choose folders, files, tags to add to context. Get files by date range, search by key terms. Can even get Youtube transcripts.

- **AI Formatting**: Create templates to format your notes with custom prompts.

-  **OCR**: AI-class text extraction from images, including handwritten notes and PDFs.

-  **Audio transcription**: Transcribe audio + dedicated Meeting Notes formatting.


<img width="1648" alt="Screenshot 2024-08-22 at 2 49 12 PM" src="https://github.com/user-attachments/assets/98f431ff-7686-4ebc-91cd-d3db198f7579">



[Chat with Youtube demo](https://youtu.be/2CNZq_6jQoQ)


[Chat with multiple files in context demo](https://youtu.be/2CNZq_6jQoQ)

## Tips and Tricks

[![Thumbnail (2)](https://github.com/different-ai/file-organizer-2000/assets/11430621/1b2c524b-11bc-484d-9255-4699783303bf)](https://youtube.com/playlist?list=PLgRcC-DFR5jdUxbSBuNeymwYTH_FSVxio&si=I7VpzzAnY0XVQ15c)

## How to use

### A. AI Assistant View

Get suggestions and choose what to apply with the Assistant view. Here's how to use it:

1. Click on the Assistant View Icon or set up the "Show Assistant" hotkey to open the Sidebar
2. Select any of your files and choose which changes to apply

<img width="1277" alt="Screenshot 2024-05-24 at 11 42 17 PM" src="https://github.com/different-ai/file-organizer-2000/assets/46509400/dc06a61f-64d0-4e10-898d-3e0330004e94">

### B. AI Inbox

Auto-organize with the AI Inbox.

We recommend the AI Assistant view for more control. But the AI Inbox can be handy as well. Simply move any of your files to the "Inbox" folder and the plugin will automatically move it to the folder it belongs. Additional configuration can also be specified within the plugin settings (e.g. auto-tagging, auto-formatting).

Move your unorganized files into `_FileOrganizer2000/Inbox`

![image](https://github.com/different-ai/file-organizer-2000/assets/11430621/295038f0-170c-456e-8e0a-e89c31719b95)

It takes a sec, and then renames, and organizes your file.

![image](https://github.com/different-ai/file-organizer-2000/assets/11430621/f9fd716f-6ada-45c4-bd59-a4efcd79b0e5)

See plugin settings to customize the changes AI Inbox applies to your files.

### C. Create custom AI Templates

Give instructions for the AI to format and modify your files.

See video: https://www.youtube.com/watch?v=rommuUXRgUw&t=17s

## Setup

Choose between the setups below:

### A. Monthly & Lifetime Plan

1. Go to general settings inside the plugin settings
2. Enter the key you generated on [File Organizer 2000 dashboard](https://app.fileorganizer2000.com/)
3. Click Activate and follow the instructions after the plan selection


### B. Self-hosting

1. Run the server

   For Linux/macOS:

   ```sh
   cd app && npm run build:self-host &&  npm run start
   ```

   And make sure you have your  `OPENAI_API_KEY` variable set up in your `.env.local` file inside the app root folder.

   For Windows (PowerShell):

   ```sh
   cd app; npm run build:self-host; npm run start
    ```

   And make sure you have your  `OPENAI_API_KEY` variable set up in your `.env.local` file inside the app root folder.


2. Go inside the Settings of the plugin and enable "Self-hosted"

<img width="707" alt="Screenshot 2024-04-13 at 07 16 21" src="https://github.com/different-ai/file-organizer-2000/assets/11430621/ca2222c9-cb8d-4d15-8459-2da4c9662f24">

## Testing Different models

For those who would like to play around with different models, there is a promptfoo.yaml file in the project including examples with local LLMS.
See link for more info: https://promptfoo.dev/docs/configuration/guide/

## Community

Join the [discord server](https://discord.gg/udQnCRFyus) for more.

## iOS shortcut to send Apple Notes and Audios to Obsidian

The iOS shortcut below makes it easy for you to easily work from your phone with this plugin.

https://www.icloud.com/shortcuts/06915768862848fb9711f2f19b6405e2

how to set it up: https://youtu.be/zWJgIRlDWkk?si=HSeOUKaMfJvaLtKI

Notes:
- It works when your vault is on a cloud drive. I use it with iCloud and works great. Doesn't work with OneDrive last time I tested.
- Currently only works if your iOS is in English. But if you reach out on discord I can help you set it up in your language.

## To Do

- [ ] Release a local LLM-only version.
- [ ] Implement browser access into AI chat.

### Notes

This plugin interacts with your filesystem.
