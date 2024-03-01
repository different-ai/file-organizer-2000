# FileOrganizer2000

  
This is an Obsidian Plugin that uses AI to keep your files organized. It transcribes audio, uses AI to annotate images, and automatically renames and moves new files to the most likely folders.



### Features

  
- Automatically move files to correct folder
- Uses OpenAI GPT Vision to extract text from images and create a markdown file with the extracted content.  
- Supports text, audio, and images

### How to install (pending obsidian store approval)
 
1. Intall [brat](obsidian://show-plugin?id=obsidian42-brat) plugin from the obsidian store.
2. Add https://github.com/different-ai/file-organizer-2000 to brat

### Quickstart
In the plugin settings, provide your OpenAI API Key. That's it :)

## How to use

Simply move any of your files to the "Inbox" folder and the plugin will automatically move it to the most likely folder.



### Use cass with the iOS Shortcut (not essential)


### Transcribe a voice recording

https://github.com/different-ai/file-organizer-2000/assets/11430621/7565a32f-4e39-4585-b2f6-7c0865d5345d


### Take a picture and automatically annotate and store it

https://github.com/different-ai/file-organizer-2000/assets/11430621/e46b87b0-ede3-4293-bca7-69cbfa8762f8



## Small iOS shortcut for easy access
The iOS shortcut bellow makes it easy for you to easily work from your phone with this plugin.

https://www.icloud.com/shortcuts/06915768862848fb9711f2f19b6405e2

## How It Works

The FileOrganizer plugin is designed to automatically organize your files in Obsidian. Here's a simplified overview of its workflow:

1. **Folder Monitoring**: The plugin watches a specific folder in your Obsidian vault, as defined in the settings. Any new or renamed files in this folder trigger the plugin's processing workflow.

2. **File Detection**: When a new or renamed file is detected, the plugin identifies the file type. For example, it can distinguish between markdown, audio, and image files.

3. **File Transformation**: Depending on the file type, the plugin processes the file using AI:

- For an image file, the AI generates a description of the image. This description is then used to create a markdown file that includes a link to the image.

4. **Renaming and Moving**: The plugin generates a human-readable name for the processed file. It then determines the appropriate destination folder for the file based on its content and moves the file to that folder.

For example, if you add an image file to the watched folder, the plugin will generate a description of the image, create a markdown file with that description and a link to the image, give the markdown file a human-readable name, and move it to the appropriate folder in your Obsidian vault.
### How to Use

1. Navigate to your `.obsidian/plugins/` directory.
2. Clone this repository in the `plugins` directory.
3. Ensure your NodeJS version is at least v16. You can check this by running `node --version`.
4. Install dependencies by running `npm i` or `yarn`.
5. Start compilation in watch mode by running `npm run dev`.

### Development

  
This plugin is developed using TypeScript. The main logic of the plugin is contained in index.ts, vision.ts, and name.ts. The plugin uses the Obsidian API to interact with the Obsidian app.  

## To Do

- [ ] Replace GPT Vision by a local model
- [ ] Make it easy for peopel to extend whaetever workflow.
- [ ] Switch to OpenAI assistant API


### Building

  
The plugin is bundled using esbuild. The configuration for esbuild is contained in esbuild.config.mjs.


### Notes

This plugin interacts with your filesystem.
