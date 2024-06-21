const { execSync } = require('child_process');
const readline = require('readline');
const fs = require('fs');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

function executeCommand(command) {
    try {
        return execSync(command, { encoding: 'utf8' });
    } catch (error) {
        console.error(`Error executing command: ${command}`);
        console.error(error.message);
        process.exit(1);
    }
}

function updatePackageVersion(version) {
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    packageJson.version = version;
    fs.writeFileSync('package.json', JSON.stringify(packageJson, null, 2));
}

function updateVersionFiles() {
    executeCommand('node version-bump.mjs');
}

async function release() {
    // Get current version
    const currentVersion = JSON.parse(fs.readFileSync('package.json', 'utf8')).version;
    console.log(`Current version: ${currentVersion}`);

    // Prompt for new version
    const newVersion = await new Promise(resolve => {
        rl.question('Enter new version number: ', resolve);
    });

    // Prompt for release description
    const description = await new Promise(resolve => {
        rl.question('Enter release description: ', resolve);
    });

    // Update package.json
    updatePackageVersion(newVersion);

    // Run version-bump.mjs
    updateVersionFiles();

    // Git commands
    executeCommand('git add .');
    executeCommand(`git commit -m "Release ${newVersion}"`);
    executeCommand(`git tag -a ${newVersion} -m "${description}"`);
    executeCommand('git push');
    executeCommand(`git push origin ${newVersion}`);

    console.log(`Version ${newVersion} has been released!`);
    rl.close();
}

release();