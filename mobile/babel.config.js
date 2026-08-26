module.exports = {
  presets: ['module:@react-native/babel-preset'],
  plugins: [
    [
      'module-resolver',
      {
        root: ['./'],
        alias: {
          '@app': './src/app',
          '@core': './src/core',
          '@features': './src/features',
          '@ui': './src/ui',
          '@shared': '../shared',
        },
      },
    ],
    'react-native-reanimated/plugin',
  ],
};
