# Native setup checklist

After `npm install`, some native modules need manual config that the RN CLI cannot infer. Do this once per fresh clone.

## iOS (`mobile/ios/*`)

Add to `Info.plist`:

```xml
<key>NSCameraUsageDescription</key>
<string>SelfCare uses your camera to take a selfie so it can analyze your skin.</string>

<key>NSPhotoLibraryUsageDescription</key>
<string>SelfCare needs access to your photos so you can pick a selfie from your library.</string>
```

Then in `ios/`:

```bash
pod install
```

Reanimated needs the babel plugin (already in [mobile/babel.config.js](../mobile/babel.config.js)). If you get "Reanimated 2 failed to create a worklet", clear metro cache: `npm start -- --reset-cache`.

## Android (`mobile/android/app/src/main/AndroidManifest.xml`)

Add inside `<manifest>`:

```xml
<uses-permission android:name="android.permission.CAMERA" />
<uses-permission android:name="android.permission.READ_MEDIA_IMAGES" />
<uses-feature android:name="android.hardware.camera" android:required="true" />
```

For ML Kit face detection on Android, add to `android/app/build.gradle` `dependencies` (auto-linking usually handles this — only touch if it fails):

```gradle
implementation 'com.google.mlkit:face-detection:16.1.7'
```

## Verifying the New Architecture

RN 0.76 ships with Fabric + TurboModules enabled by default. If a native lib you add later doesn't support the new architecture, you can temporarily fall back:

- iOS: `RCT_NEW_ARCH_ENABLED=0` in `ios/Podfile.properties.json`
- Android: `newArchEnabled=false` in `android/gradle.properties`

## Backend reachability from a device

- iOS Simulator: `localhost:8080` works.
- Android Emulator: use `10.0.2.2:8080` (already set in [core/config/env.ts](../mobile/src/core/config/env.ts)).
- Physical device: replace `apiBaseUrl` with your dev machine's LAN IP and run the server on `0.0.0.0`.
