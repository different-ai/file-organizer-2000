# File Organizer 2000

Transform your Obsidian workflow with AI-powered organization and note management. 

Features:
- AI Chat
- File Organization
- Meeting Notes Enhancer

<img width="1840" alt="Screenshot 2025-01-18 at 09 07 18" src="https://github.com/user-attachments/assets/efce35ad-fbf9-47c2-a6e8-a509709e7b7c" />

## 🌟 Key Use Cases

### 🗄️ Smart Vault Management
Transform your vault into an intelligent knowledge base using our powerful tools:

1. **Context-Aware File Organization**
   - AI Assistant suggests optimal file locations based on content
   - Automatic tagging and categorization
   - Smart folder suggestions based on existing vault structure

2. **Powerful Search and Retrieval**
   - Search across your vault using natural language
   - Find files by date range, content type, or keywords
   - Include YouTube transcripts in your search context

3. **Custom Automation Tools**
   - LastModifiedHandler: Track and organize recently modified files
   - ScreenpipeHandler: Monitor daily activities and notes
   - ExecuteActionsHandler: Automate repetitive file management tasks

4. **AI Chat Integration**
   - Context-aware AI chat that understands your vault structure
   - Select multiple files, folders, or tags to include in chat context
   - Create and save custom prompts for repeated tasks

### ✍️ Handwritten Notes Digitization
- **Advanced OCR Integration**: Automatically convert handwritten notes and diagrams into searchable digital text
- **Smart Organization**: AI automatically suggests appropriate file names, tags, and folders for your digitized notes
- **Batch Processing**: Drop multiple handwritten notes into the Inbox for automated processing
- **Diagram Recognition**: Preserves and processes hand-drawn diagrams alongside text


### 📝 Intelligent Meeting Notes (Granola-style)
- **Granola-like Meeting Notes**: Transform your meetings into structured, actionable notes with the same powerful organization as Granola
- **Automated Enhancement**: Record meetings and let AI transform them into clear, structured notes with action items
- **Smart Transcript Integration**: Automatically merge new meeting transcripts with existing notes, maintaining context and coherence
- **Customizable Templates**: Create your own meeting note templates for consistent formatting across all meetings



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


