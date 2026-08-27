type Env = {
  apiBaseUrl: string;
};

const dev: Env = {
  // `npm run android`/ADB development uses reverse port forwarding so the
  // same URL works on emulators and physical Android devices.
  apiBaseUrl: 'http://localhost:8080',
};

const prod: Env = {
  apiBaseUrl: 'https://api.selfcare.example.com',
};

export const env: Env = __DEV__ ? dev : prod;
