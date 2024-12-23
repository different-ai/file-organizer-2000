# File Organizer 2000

Automate the most painful part of your Obsidian worfklow.



### What do people do with it

- **Organize all their handwritten notes** digitized and automatically organized (diagrams work too!)
- **Generating action items from their meetings**. Record an audio with voice memo app put it in File Organizer "Inbox" and it will automatically be transcribed and have action items extracted.

## How can I get it 
The plugin is self-hostable and or available with cloud subscription.

### Features

- **Automatic Organization:** Automatically suggests file names, tags and folders for your notes & more.

-  **Handwritten notes &**: AI-class text extraction from images, including handwritten notes and PDFs.

- **Cursor-like AI Chat**: The most powerful chat for Obsidian 🦾 Select folders, files, tags to add to context. Get files by date range, search by key terms. Can even get Youtube transcripts.

- **Save Custom Prompts and Reuse later**: Create templates to format your notes with custom prompts.

-  **Audio transcription**: Transcribe audio + dedicated Meeting Notes formatting.


<p>
  <a href="https://fileorganizer2000.com/"><img src="https://img.shields.io/badge/Try-File%20Organizer%202000-7852ee?style=flat&logoColor=white" alt="Try File Organizer 2000"></a>
  <a href="https://discord.gg/UWH53WqFuE"><img src="https://img.shields.io/discord/1231880202259533865?label=Discord&logo=discord&logoColor=white&color=5865F2&style=flat" alt="Join Discord"></a>
  <a href="https://youtube.com/playlist?list=PLgRcC-DFR5jcwwg0Dr3gNZrkZxkztraKE&si=ZCn2ndFz-zN2cfML"><img src="https://img.shields.io/youtube/channel/subscribers/UCd24YzGlvtIG4DYD3zlYLwg?label=YouTube&color=34d399&style=flat&logo=youtube&logoColor=white" alt="YouTube Subscribers"></a>
  <a href="https://console.algora.io/org/different-ai/bounties?status=completed"><img src="https://img.shields.io/endpoint?url=https%3A%2F%2Fconsole.algora.io%2Fapi%2Fshields%2Fdifferent-ai%2Fbounties%3Fstatus%3Dcompleted" alt="Rewarded Bounties"></a>
  <a href="https://console.algora.io/org/different-ai/bounties?status=open"><img src="https://img.shields.io/endpoint?url=https%3A%2F%2Fconsole.algora.io%2Fapi%2Fshields%2Fdifferent-ai%2Fbounties%3Fstatus%3Dopen" alt="Open Bounties"></a>
</p>

An Obsid


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

### D. Misc

To use llama 3.2 with the ai chat, install Ollama + llama 3.2 and check this setting in the plugin:

<img width="751" alt="Screenshot 2024-10-26 at 7 34 18 PM" src="https://github.com/user-attachments/assets/95add737-9cd5-4cb4-a360-ff5fc95ebfa7">


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
   cd packages/web && pnpm build:self-host && pnpm start
   ```

   And make sure you have your `OPENAI_API_KEY` variable set up in your `.env.local` file inside the `packages/web` directory.

   For Windows (PowerShell):

   ```sh
   cd packages/web; pnpm build:self-host; pnpm start
   ```

   And make sure you have your `OPENAI_API_KEY` variable set up in your `.env.local` file inside the `packages/web` directory.

2. Enable self-hosted mode in plugin settings:

   <img width="707" alt="Screenshot 2024-04-13 at 07 16 21" src="https://github.com/different-ai/file-organizer-2000/assets/11430621/ca2222c9-cb8d-4d15-8459-2da4c9662f24">

### C. Development Setup

This is a monorepo using pnpm workspaces and Turborepo. To get started:

1. Install dependencies:
   ```sh
   pnpm install
   ```

2. Build all packages:
   ```sh
   pnpm build
   ```

3. Development commands:
   - Start web development server: `cd packages/web && pnpm dev`
   - Build plugin: `cd packages/plugin && pnpm build`
   - Build audio server: `cd packages/audio-server && pnpm build`

The project consists of the following packages:
- `packages/plugin`: The Obsidian plugin
- `packages/web`: The web application
- `packages/audio-server`: Audio transcription server
- `packages/shared`: Shared utilities and types

For the tech-savvies who would like to play around with different models, there is a promptfoo.yaml file in the project including examples with local LLMs.
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
- [ ] AI chat improvements.

### Notes

This plugin interacts with your filesystem.
