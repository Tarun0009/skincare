// Sentry MUST init before React Native's error handlers wire up, so we
// initialise it as the very first thing on app boot.
import { initSentry } from './src/core/observability/sentry';
initSentry();

import { AppRegistry } from 'react-native';
import App from './App';
import { name as appName } from './app.json';

AppRegistry.registerComponent(appName, () => App);
