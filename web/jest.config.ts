import type { Config } from '@jest/types';

const config: Config.InitialOptions = {
  // Specify the correct root directory for Jest to look for test files
  roots: ['<rootDir>/scripts'],

  // Use TypeScript for Jest
  transform: {
    '^.+\\.tsx?$': 'ts-jest',
  },

  // Module file extensions for importing
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],


  // Test environment
  testEnvironment: 'node',
  // every file that has .test.ts will be run
  testMatch: ['**/**/*.test.ts'],
  // use jest.setup.js for global setup
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],

  testTimeout: 30000, // 30 seconds
  // Other Jest configurations can go here
};

export default config;