# Running File Organizer 2000 as a standalone script
> Note: this is a prototype. Use at your own risk.

File Organizer 2000 organizes your files. You can initialize it on your fs and it will create a special folder for you. Anything that gets dropped into this folder automatically gets annotated with a name, and organized in a folder.

## Demo
![Export-1715531773755](https://github.com/different-ai/file-organizer-2000/assets/11430621/f1bcaf98-c0ff-4ef2-8a9d-fc8c0521ce26)



## How to use 
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
