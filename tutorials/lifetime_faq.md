
# Note Companion Lifetime Setup FAQ

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


# Vercel Lifetime: Keeping Your Deployment Up-to-Date



If you've chosen Vercel as your deployment system, it's important to ensure that your server code remains up-to-date with the latest changes. Below, you'll find instructions on how to set up automatic updates and manually update your repository.

## Video walkthrough
https://www.loom.com/share/528ff69dedf64b43a57492bcba2ca6c2


## Setting Up Auto-Updates

To automate updates for your Vercel instance, follow these steps:

1. **Access GitHub Actions**: 
   - Navigate to your project on GitHub.
   - Click on the "Actions" tab.
   - Select "Set up a workflow yourself."

2. **Create a Workflow File**:
   - Copy the following YAML configuration into your workflow file:

     ```yaml
     on:
       schedule:
         - cron: '0 0 * * *' # Runs daily at midnight UTC
       workflow_dispatch: # Allows manual triggering

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

3. **Set Up Personal Access Token (PAT)**:
   - Go to your GitHub settings.
   - Navigate to "Developer settings" and create a new "Personal Access Token" with the necessary permissions.
   - Add this token as a secret in your GitHub repository settings under "Secrets and variables" with the name `PAT3`.

4. **Commit and Activate**:
   - Commit the workflow file to your repository.
   - The workflow will now automatically run daily at midnight UTC, updating your deployment.

## Manually Triggering Updates

If you need to update your deployment manually (for instance, after a recent fix), you can do so by:

1. Navigating to the "Actions" tab in your GitHub repository.
2. Locating the workflow you set up.
3. Clicking on "Run workflow" to trigger the update manually.

This manual trigger is useful if you want to ensure your deployment is immediately up-to-date with the latest changes.

<img width="1422" alt="Screenshot 2024-11-17 at 09 51 25" src="https://github.com/user-attachments/assets/e1a0ad92-c8e4-4a11-a0be-de0dccf99281">

## Checking if it works
Open up vercel and check if there was a new deployment for your project (or if it might still be building):
<img width="852" alt="Screenshot 2024-11-17 at 09 58 31" src="https://github.com/user-attachments/assets/84f63f56-9880-451a-9c49-54407bb5fd6f">





