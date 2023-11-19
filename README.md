# FileOrganizer2000

  
This repository contains the code for the Obsidian plugin "File Organizer 2000". This plugin auto-organizes your files, starting with images. It uses GPT Vision to automatically convert your images into text. You can use it for OCR, but it goes also beyond that.  

⚠️ ALPHA Highly experimental

### Features

  
- Automatically move files to correct folder
- Uses OpenAI GPT Vision to extract text from images and create a markdown file with the extracted content.  
- Supports text, audio, and images.

## Use Case
- Record a voice memo on your iphone and automatically get it transcribed inside of Obsidian. [You can use this shortcut to make it easier](https://www.icloud.com/shortcuts/36299c16415d4d0e9acfd32eaae4f3f6)


### Demo

### Move Files
> Example shows a file being added to the "Inbox" and automatically moved to a relevant folder.

https://github.com/different-ai/gpt-file-organizer/assets/11430621/f9c8ed77-828f-4a42-a382-4dd01ca17e22


### Transcribe Audio
> Example shows how FileOrganizer2000 automatically detects a new image and adds it inside `/Processed` with an annotation.

https://github.com/different-ai/obsidian-file-organizer2000/assets/11430621/eaea27e6-d5ed-4e02-8722-173dea1351ba

### Automatically Annotate Images
> Example shows how FileOrganizer2000 detects a handwritten note and automatically extracts the text moves it to `/Processed` using a human understandable name.

https://github.com/different-ai/obsidian-file-organizer2000/assets/11430621/364f3ad8-e1b2-46c6-a114-eee5aad0755e



### How to Use

1. Navigate to your `.obsidian/plugins/` directory.
2. Clone this repository in the `plugins` directory.
3. Ensure your NodeJS version is at least v16. You can check this by running `node --version`.
4. Install dependencies by running `npm i` or `yarn`.
5. Start compilation in watch mode by running `npm run dev`.

### Manual Installation

  
Copy over main.js, styles.css, manifest.json to your vault VaultFolder/.obsidian/plugins/your-plugin-id/.  

### Development

  
This plugin is developed using TypeScript. The main logic of the plugin is contained in index.js, vision.ts, and name.ts. The plugin uses the Obsidian API to interact with the Obsidian app.  

## To Do

- Replace GPT Vision by a local model
- Make it easy for peopel to extend whaetever workflow.

### Building

  
The plugin is bundled using esbuild. The configuration for esbuild is contained in esbuild.config.mjs.
