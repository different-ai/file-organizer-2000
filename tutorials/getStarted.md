# Get Started with FileOrganizer 2000

## Cloud-hosted
  
1. Install & enable the plugin.
2. Go to plugin Options and click on the "Login" button.
3. Sign up.
4. You'll then be redirected to a screen with button to generate an API key.
5. Once you have your API key, copy & paste it into the plugin Options in the "Enter your API Key" field.
6. That's it. Now, access your vault within the Obsidian app, and  move a file into the dedicated Inbox folder. See the magic?!

## Self-hosted (requires technical skills & an external OpenAI API key with credits)

1. Clone [the repo](https://github.com/different-ai/file-organizer-2000) into the `.obsidian/plugins/` folder within your vault.
2. Get yourself an OpenAI API key and purchase a minimum of $5 credit.
3. Inside the project, access the app folder with `cd app` & run  `npm i && OPENAI_API_KEY={YOUR_API_KEY} ENABLE_USER_MANAGEMENT=false npm run dev`.
4. Go to community plugins in your Obsidian app and click the refresh icon under "Installed plugins". AI File Organizer should now appear. Enable it. 
5. Go to plugin Options and enable Use Self-Hosted under Experimental features
6. Paste <http://localhost:3000/> into the URL input below.
7. That's it. You made it! Now, access your vault within the Obsidian app, and  move a file into the dedicated Inbox folder. See the magic?!
