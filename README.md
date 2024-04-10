**Requires access to GPT-4 API**


# AI File Organizer 2000

  
This is an Obsidian Plugin that uses AI to keep your files organized. It transcribes audio, uses AI to annotate images, and automatically renames and moves new files to the most likely folders.



### Features

  
- Automatically move files to correct folder
- Supports text, audio, and images
- Local-first LLM support (coming soon, like very soon there's already a branch)


### Self-hosting

Atm a bit complicated but we'll strive to make it simpler very soon. Great first issue if you want to get your hands dirty 😀.

1. Run the next js repo inside of `./app` (`npm i && OPENAI_API_KEY=[your open ai api key] )
2. You need to subsite the hardcoded url inside of all the `./modules` files and replace it with your localhost version.


I know, I know this seems complicated and undcalled for. But we're taking this to the next step and that's the route that will lead us to move as fast possible.



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
