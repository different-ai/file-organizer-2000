
# File Organizer 2000 Lifetime Setup FAQ

## If you need assistance 

Please make sure your github repository is public before reaching out so we can help you troubleshoot. Here's how you can do that if it's not already done: 

https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/managing-repository-settings/setting-repository-visibility#changing-a-repositorys-visibility


### If you are having issues with "License Key Invalid" 

- Use the URL that you see after clicking on the page you deployed (as shown below)
If you see a bunch of random numbers + letters in your URL, you are using the wrong one.
If it includes "self-hosted" or "dashboard", you are also using the wrong url

<img width="969" alt="Screenshot 2024-11-07 at 12 01 56 PM" src="https://github.com/user-attachments/assets/62fc2c0f-f591-4057-9c2d-ebefd5b0b8e5">



- Make sure to use the same license key in vercel and in obsidian. If you forget it you can access it by going into vercel and navigate to setting > environment variables and reveal SOLO_API_KEY. (as shown below)


<img width="1165" alt="Screenshot 2024-11-06 at 2 11 25 PM" src="https://github.com/user-attachments/assets/6752bf08-6dd3-4b89-902c-bd3e84fa0616">




- Make sure SOLO_API_KEY is your license key and OPENAI_API_KEY is the openAI API key

---

### How can I change the model? 

- See youtube video: https://www.youtube.com/watch?v=yVZn-cGOMzE
- Currently only works with any openAI compatible model

---


## Vercel Lifetime

If you decided to use vercel as your deployment system, there is a chance that your server code end up out of dates with ours.

Below you'll find some instructions on how to:
- set up auto-updates
- manually update your repo (requires auto-update to be setup)

### Setting up auto update

To set up your instance for auto-updates, you can follow these instructions: 

https://www.loom.com/share/528ff69dedf64b43a57492bcba2ca6c2

```name: Sync /web Directory from Upstream Repository

on:
  schedule:
    - cron: '0 0 * * *'  # Runs daily at midnight UTC
  workflow_dispatch:  # Allows manual triggering

permissions:
  contents: write

jobs:
  sync_web_directory:
    runs-on: ubuntu-latest

    steps:
      # Step 1: Checkout your repository
      - name: Checkout Your Repository
        uses: actions/checkout@v3
        with:
          ref: main
          fetch-depth: 0
          token: ${{ secrets.PAT3 }}  # Use PAT with appropriate permissions

      # Step 2: Configure Git (Set author identity globally)
      - name: Configure Git
        run: |
          git config --global user.name "GitHub Actions"
          git config --global user.email "actions@github.com"

      # Step 3: Remove Existing Files Except .git and .github
      - name: Remove Existing Files
        run: |
          find . -mindepth 1 -maxdepth 1 \
          ! -name '.git' \
          ! -name '.github' \
          -exec rm -rf {} +

      # Step 4: Checkout /web Directory from Upstream
      - name: Checkout /web Directory from Upstream
        uses: actions/checkout@v3
        with:
          repository: different-ai/file-organizer-2000
          ref: master
          path: upstream_repo
          # Uses default GITHUB_TOKEN for read access

      # Step 5: Copy /web Contents to Root
      - name: Copy /web Contents to Root
        run: |
          cp -r upstream_repo/web/* .

      # Step 6: Remove upstream_repo Directory
      - name: Remove Upstream Repo Directory
        run: rm -rf upstream_repo

      # Step 7: Commit and Push Changes
      - name: Commit and Push Changes
        run: |
          git add .
          git commit -m "Update repository with latest /web content from upstream"
          git push origin main
```

---



## Manually triggering updates

If you setup auto-updates via our instructions above you can go to actions, look for the worfklow, and click on run workflow.

And run the update action manually. If you don't we trigger updates every 24h.

This might be useful if we just shipped a fix and you want to be up to date.

<img width="1422" alt="Screenshot 2024-11-17 at 09 51 25" src="https://github.com/user-attachments/assets/e1a0ad92-c8e4-4a11-a0be-de0dccf99281">





