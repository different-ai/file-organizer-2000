#!/usr/bin/env node

import path from 'path';
import fs from 'fs';
import * as tsNode from 'ts-node';
import { deploy } from './deploy';

// Register ts-node to handle TypeScript files
tsNode.register({
  compilerOptions: {
    module: 'commonjs',
  },
});

async function main() {
  const args = process.argv.slice(2);
  console.log('Received arguments:', args);

  if (args[0] === 'deploy') {
    let configPath = 'srm.config.ts';
    let envFilePath = '.env';
    
    console.log('Initial config path:', configPath);
    console.log('Initial env file path:', envFilePath);

    // Parse command-line arguments
    for (let i = 1; i < args.length; i += 2) {
      console.log(`Checking argument: ${args[i]}`);
      if (args[i] === '--config') {
        configPath = args[i + 1] || configPath;
        console.log('Updated config path:', configPath);
      } else if (args[i] === '--env') {
        envFilePath = args[i + 1] || envFilePath;
        console.log('Updated env file path:', envFilePath);
      }
    }
    
    console.log(`Final config path: ${configPath}`);
    console.log(`Final env file path: ${envFilePath}`);

    // Check if the config file exists
    if (!fs.existsSync(configPath)) {
      console.error(`Configuration file not found: ${configPath}`);
      process.exit(1);
    }

    // Check if the .env file exists
    if (!fs.existsSync(envFilePath)) {
      console.warn(`Warning: Environment file not found: ${envFilePath}`);
      console.warn('Proceeding without environment variables. Make sure STRIPE_SECRET_KEY is set.');
    }

    try {
      await deploy(configPath, envFilePath);
    } catch (error) {
      console.error('Error during deployment:', error);
      if (error instanceof Error && error.message.includes('Cannot find module')) {
        console.error(`Make sure the configuration file exists at: ${path.resolve(process.cwd(), configPath)}`);
      }
      process.exit(1);
    }
  } else {
    console.error('Unknown command. Use "srm deploy --config [path-to-config] --env [path-to-env-file]"');
    process.exit(1);
  }
}

main().catch((error) => {
  console.error('Error executing SRM command:', error);
  process.exit(1);
});