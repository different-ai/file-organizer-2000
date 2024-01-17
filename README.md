# FileOrganizer2000

  
This is an Obsidian Plugin that uses AI to keep your files organized. It transcribes audio, uses AI to annotate images, and automatically renames and moves new files to the most likeley folders.



### Features

  
- Automatically move files to correct folder
- Uses OpenAI GPT Vision to extract text from images and create a markdown file with the extracted content.  
- Supports text, audio, and images

### Quickstart
In the plugin settings, provide your OpenAI API Key. That's it :)

## How to use

Simply move any of your file to the "Inbox" folder and the plugin will automatically move it to the most likely folder.



### Move Files
> Example shows a file being added to the "Inbox" and automatically moved to a relevant folder.

https://github.com/different-ai/gpt-file-organizer/assets/11430621/f9c8ed77-828f-4a42-a382-4dd01ca17e22


### Transcribe Audio
> Example shows how FileOrganizer2000 automatically detects a new image and adds it inside `/Processed` with an annotation.

https://github.com/different-ai/obsidian-file-organizer2000/assets/11430621/eaea27e6-d5ed-4e02-8722-173dea1351ba

### Automatically Annotate Images
> Example shows how FileOrganizer2000 detects a handwritten note and automatically extracts the text moves it to `/Processed` using a human understandable name.

https://github.com/different-ai/obsidian-file-organizer2000/assets/11430621/364f3ad8-e1b2-46c6-a114-eee5aad0755e





### Go beyond, with the iOS Shortcut (not essential)
The iOS shortcut bellow makes it easy for you to easily work from your phone with this plugin.

https://www.icloud.com/shortcuts/06915768862848fb9711f2f19b6405e2

Voice Memo:

https://github.com/different-ai/file-organizer-2000/assets/11430621/7565a32f-4e39-4585-b2f6-7c0865d5345d


Photos:

https://github.com/different-ai/file-organizer-2000/assets/11430621/e46b87b0-ede3-4293-bca7-69cbfa8762f8

From Clipboard:

https://github.com/different-ai/file-organizer-2000/assets/11430621/e5c5272e-914a-4b1a-98ce-af4def60538f


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
