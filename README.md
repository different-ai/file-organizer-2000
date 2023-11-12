# File Organizer 2000

  
This repository contains the code for the Obsidian plugin "File Organizer 2000". This plugin auto-organizes your files, starting with images. It uses GPT Vision to automatically convert your images into text. You can use it for OCR, but it goes also beyond that.  

### Features

  
- Automatically processes newly created image files in supported formats (png, jpeg, gif, webp, jpg).  
- Uses GPT Vision to extract text from images and create a markdown file with the extracted content.  
- The markdown file is named using a title generated by GPT-3.5-turbo.  
- The markdown file includes a link to the original image.  

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

### Building

  
The plugin is bundled using esbuild. The configuration for esbuild is contained in esbuild.config.mjs.