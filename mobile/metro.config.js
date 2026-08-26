const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');
const path = require('path');

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '..');

/**
 * Shared/{types.ts} lives outside `mobile/`, so we add it to watchFolders and
 * alias it as `@shared`. `unstable_enablePackageExports` is turned off because
 * a handful of RN libraries (react-native-svg 15.8 included) don't declare an
 * `exports` field but ship raw TS in `src/` — leaving the default on makes
 * Metro miss re-exports inside those packages.
 */
const config = {
  watchFolders: [path.resolve(workspaceRoot, 'shared')],
  resolver: {
    unstable_enablePackageExports: false,
    extraNodeModules: {
      '@shared': path.resolve(workspaceRoot, 'shared'),
    },
  },
};

module.exports = mergeConfig(getDefaultConfig(projectRoot), config);
