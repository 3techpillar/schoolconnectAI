const path = require('path');
const {getDefaultConfig, mergeConfig} = require('@react-native/metro-config');

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '../..');

/**
 * Monorepo Metro — watch packages/shared and resolve workspace deps.
 * @type {import('metro-config').MetroConfig}
 */
const config = {
  watchFolders: [workspaceRoot],
  resolver: {
    nodeModulesPaths: [
      path.resolve(projectRoot, 'node_modules'),
      path.resolve(workspaceRoot, 'node_modules'),
    ],
    disableHierarchicalLookup: true,
    extraNodeModules: {
      '@schoolconnect/shared': path.resolve(
        workspaceRoot,
        'packages/shared',
      ),
    },
  },
};

module.exports = mergeConfig(getDefaultConfig(projectRoot), config);
