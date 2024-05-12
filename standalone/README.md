# Running File Organizer 2000 as a standalone script


## Demo



```bash
git clone git@github.com:different-ai/file-organizer-2000.git
## go to root of repo
cd file-organizer-2000
# run the server
cd app
npm i
npm run build
## checkout the tutorials file to use w/ ollama
OPENAI_API_KEY=sk-youropenaikey npm start
## go back to root of repo
cd ..
## run the standalone script
npm run standalone
```

