# File Organizer 2000

**File Organizer 2000** is an AI-powered Obsidian plugin that automatically organizes and formats your notes—your way.

## 🌟 Features

- 🗂️ **Organizing Suggestions**: Get AI-driven suggestions for folders, tags, filenames, and more.
- 🎛️ **Custom Format AI Prompts**: Save and apply your own AI prompts for consistency.
- 📁 **Automated Workflows**: Streamline your file management and formatting tasks.
- 📖 **Handwritten Note Digitization**: Convert handwritten notes into searchable digital text.
- 🔊 **Audio Transcription**: Easily transcribe and organize audio files.
- ✂️ **Atomic Note Generation**: Break down larger notes into smaller, more focused ones.
- 🎥 **YouTube Summaries**: Quickly generate summaries for YouTube videos.
- 💬 **Context-Aware AI Chat**: Use AI to chat with multiple notes in context.

![File Organizer Screenshot](https://github.com/user-attachments/assets/efce35ad-fbf9-47c2-a6e8-a509709e7b7c)

---

## 🗄️ Key Use Cases

### Smart Vault Management
Transform your Obsidian vault into an intelligent knowledge base:
1. **Context-Aware Organization**: AI suggests tags, folders, and filenames based on content.
2. **Powerful Search**: Natural language search across files, including YouTube transcripts.
3. **Automation Tools**:
   - `LastModifiedHandler`: Track and organize recently modified files.
   - `ScreenpipeHandler`: Monitor daily activities.
   - `ExecuteActionsHandler`: Automate repetitive tasks.

### Handwritten Notes Digitization
- **Advanced OCR Integration**: Convert handwritten notes and diagrams into digital text.
- **Batch Processing**: Automate organization for multiple notes at once.
- **Diagram Recognition**: Preserve and process hand-drawn diagrams.

### Intelligent Meeting Notes
- **Granola-Style Notes**: Automatically create structured and actionable meeting notes.
- **Smart Transcript Integration**: Merge meeting transcripts with existing notes.
- **Customizable Templates**: Ensure consistent formatting for all notes.

---

## 🚀 Getting Started

Choose your preferred setup:

### A. Cloud Subscription
1. Access our managed service with all features included
2. No setup required - just activate your license key
3. Regular updates and new features

### B. Self-Hosted Solution
1. Run your own instance with full control
2. Use your preferred AI models
3. Complete privacy with local processing

1. Run the server
   For Linux/macOS:
   ```sh
   cd packages/web && pnpm build:self-host && pnpm start
   ```
   And make sure you have your `OPENAI_API_KEY` variable set up in your `.env.local` file inside the `packages/web` directory. If you want to use Amazon Bedrock models, you'll also need to configure AWS credentials (`AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_REGION`).
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



## 📱 Mobile Integration

Seamlessly integrate with your mobile workflow:
- iOS Shortcut for sending Apple Notes to Obsidian
- Voice memo support for instant meeting notes
- Cloud sync compatibility (works great with iCloud)

## iOS shortcut to send Apple Notes and Audios to Obsidian
The iOS shortcut below makes it easy for you to easily work from your phone with this plugin.
https://www.icloud.com/shortcuts/06915768862848fb9711f2f19b6405e2
how to set it up: https://youtu.be/zWJgIRlDWkk?si=HSeOUKaMfJvaLtKI

Notes:
- It works when your vault is on a cloud drive. I use it with iCloud and works great. Doesn't work with OneDrive last time I tested.
- Currently only works if your iOS is in English. But if you reach out on discord I can help you set it up in your language.


## 🛠️ Advanced Features

### Custom AI Templates
Create powerful automation workflows:
- Define custom processing rules
- Set up automatic file naming conventions
- Configure content formatting templates

### Multi-Modal Support
Process various types of content:
- Audio transcription
- Image OCR
- PDF text extraction
- YouTube video transcripts


