module.exports = {
  root: true,
  extends: '@react-native',
  rules: {
    // React 17+ automatic JSX runtime (the RN 0.76 default) removes the need
    // to import React just to use JSX. Both rules are legacy for that setup.
    'react/react-in-jsx-scope': 'off',
    'react/jsx-uses-react': 'off',
  },
};
