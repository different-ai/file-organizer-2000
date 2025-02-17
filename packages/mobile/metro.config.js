const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot = __dirname;

const config = getDefaultConfig(projectRoot);

// Add custom configuration
config.resolver.alias = {
  '@': path.resolve(projectRoot, './'),
};

module.exports = config; 