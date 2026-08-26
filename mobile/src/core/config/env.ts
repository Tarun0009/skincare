import { Platform } from 'react-native';

type Env = {
  apiBaseUrl: string;
};

const dev: Env = {
  // Android emulator maps host localhost -> 10.0.2.2.
  // iOS simulator can hit localhost directly.
  apiBaseUrl: Platform.select({
    android: 'http://10.0.2.2:8080',
    ios: 'http://localhost:8080',
    default: 'http://localhost:8080',
  }),
};

const prod: Env = {
  apiBaseUrl: 'https://api.selfcare.example.com',
};

export const env: Env = __DEV__ ? dev : prod;
