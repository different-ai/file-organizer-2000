#!/usr/bin/env node
import { deploy } from './deploy';
import { pull } from './pull';
import path from 'path';
import fs from 'fs';

interface CommandOptions {
  config?: string;
  env?: string;
}

function printHelp() {
  console.log(`
Usage: srm <command> [options]

Commands:
  deploy    Deploy configuration to Stripe
  pull      Pull configuration from Stripe

Options:
  --config <path>    Path to the configuration file (default: srm.config.ts)
  --env <path>       Path to the .env file (default: .env)
  --help             Show this help message

Examples:
  srm deploy
  srm deploy --config custom-config.ts --env .env.production
  srm pull
  srm pull --config custom-config.ts --env .env.production
  `);
}

function parseOptions(args: string[]): CommandOptions {
  const options: CommandOptions = {};
  for (let i = 1; i < args.length; i += 2) {
    if (args[i] === '--config') {
      options.config = args[i + 1];
    } else if (args[i] === '--env') {
      options.env = args[i + 1];
    }
  }
  return options;
}

function validateConfigPath(configPath: string) {
  const resolvedPath = path.resolve(process.cwd(), configPath);
  if (!fs.existsSync(resolvedPath)) {
    throw new Error(`Configuration file not found: ${resolvedPath}`);
  }
  return resolvedPath;
}

async function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  if (args.includes('--help') || !command) {
    printHelp();
    process.exit(0);
  }

  const options = parseOptions(args);

  try {
    switch (command) {
      case 'deploy':
        // Dynamically import ts-node only when needed
        const tsNode = await import('ts-node');
        tsNode.register({
          compilerOptions: {
            module: 'commonjs',
          },
        });
        await deploy(
          options.config && validateConfigPath(options.config),
          options.env
        );
        break;
      case 'pull':
        await pull(
          options.config && validateConfigPath(options.config),
          options.env
        );
        break;
      default:
        console.error(`Unknown command: ${command}`);
        printHelp();
        process.exit(1);
    }
  } catch (error) {
    if (error instanceof Error) {
      console.error('Error:', error.message);
      if (error.message.includes('Configuration file not found')) {
        console.error('Please make sure the configuration file exists and the path is correct.');
      }
    } else {
      console.error('An unexpected error occurred:', error);
    }
    process.exit(1);
  }
}

main().catch((error) => {
  console.error('Error executing SRM command:', error);
  process.exit(1);
});