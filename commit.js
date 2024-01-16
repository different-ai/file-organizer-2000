const fs = require('fs');
const { exec } = require('child_process');

// Read manifest.json
fs.readFile('manifest.json', 'utf8', (err, data) => {
    if (err) {
        console.error(`Error reading file: ${err}`);
        return;
    }

    // Parse JSON
    const manifest = JSON.parse(data);
    const version = manifest.version;

    // Create git tag and push
    exec(`git tag -a ${version} -m "${version}" && git push origin ${version}`, (err, stdout, stderr) => {
        if (err) {
            console.error(`Error executing git commands: ${err}`);
            return;
        }

        console.log(`Tag ${version} created and pushed successfully.`);
    });
});