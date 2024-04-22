Consider Supporting this project:
https://dub.sh/support-fo2k

Having more supporters means we can serve you better, and faster!



# AI File Organizer 2000
  
This is an Obsidian Plugin that uses AI to keep your files organized. It transcribes audio, uses AI to annotate images, and automatically renames and moves new files to the most likely folders.

### Features

  
- Automatically move files to correct folder
- Supports text, audio, and images
- Local-first LLM support (coming soon, like very soon there's already a branch)



## Tips and Tricks
[![Thumbnail (2)](https://github.com/different-ai/file-organizer-2000/assets/11430621/1b2c524b-11bc-484d-9255-4699783303bf)](https://youtube.com/playlist?list=PLgRcC-DFR5jdUxbSBuNeymwYTH_FSVxio&si=I7VpzzAnY0XVQ15c)



## How to use

Simply move any of your files to the "Inbox" folder and the plugin will automatically move it to the most likely folder.

Place your unorganized files into `_FileOrganizer2000/Inbox`

![image](https://github.com/different-ai/file-organizer-2000/assets/11430621/295038f0-170c-456e-8e0a-e89c31719b95)

It takes a sec, and then renames, and organizes your file.

![image](https://github.com/different-ai/file-organizer-2000/assets/11430621/f9fd716f-6ada-45c4-bd59-a4efcd79b0e5)




## Self-hosting

1. Run the server

    For Linux/macOS:
    ```sh
    cd ./app
    npm i && npm run build
    OPENAI_API_KEY=[your open ai api key] npm run start
    ```
    Replace `[your open ai api key]` with your actual OpenAI API key.

    For Windows (PowerShell):
    ```sh
    cd .\app
    npm i; npm run build
    $env:OPENAI_API_KEY="your open ai api key"; npm run start
    ```
    Replace `your open ai api key` with your actual OpenAI API key.



2. Go inside the Settings of the plugin and enable "Self-hosted"


<img width="707" alt="Screenshot 2024-04-13 at 07 16 21" src="https://github.com/different-ai/file-organizer-2000/assets/11430621/ca2222c9-cb8d-4d15-8459-2da4c9662f24">

## Community

Join the [discord server](https://discord.gg/KSdyURjP) for more.

## Small iOS shortcut for easy access
The iOS shortcut below makes it easy for you to easily work from your phone with this plugin.

https://www.icloud.com/shortcuts/06915768862848fb9711f2f19b6405e2



## To Do

- [ ] Replace GPT Vision by a local model
- [ ] Make it easy for people to extend whatever workflow.



### Notes

This plugin interacts with your filesystem.
