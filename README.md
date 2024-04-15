Consider Supporting this project:
https://dub.sh/support-fo2k


# AI File Organizer 2000
  
This is an Obsidian Plugin that uses AI to keep your files organized. It transcribes audio, uses AI to annotate images, and automatically renames and moves new files to the most likely folders.


### Features

  
- Automatically move files to correct folder
- Supports text, audio, and images
- Local-first LLM support (coming soon, like very soon there's already a branch)


### Self-hosting

1. Run  server
```sh
cd ./app
npm i && npm run build
OPENAI_API_KEY=[your open ai api key] npm run start
```

2. Go inside the Settings of the plugin and enable "Self-hosted"


<img width="707" alt="Screenshot 2024-04-13 at 07 16 21" src="https://github.com/different-ai/file-organizer-2000/assets/11430621/ca2222c9-cb8d-4d15-8459-2da4c9662f24">





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



## To Do

- [ ] Replace GPT Vision by a local model
- [ ] Make it easy for peopel to extend whaetever workflow.
- [ ] Switch to OpenAI assistant API



### Notes

This plugin interacts with your filesystem.
