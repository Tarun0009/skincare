# selfcare — AI Skin Analyzer

Take a selfie. Get an AI-analyzed skin report + personalized routine. Track improvement over time with side-by-side before/after.

## Structure
- `mobile/` — React Native CLI app (iOS + Android, TypeScript). Feature-based `src/` layout.
- `server/` — Fastify backend (proxies Gemini, stores photos + history).
- `shared/` — TypeScript types used by both.
- `docs/` — demo script + notes.

## Mobile source layout (feature-based)

```
mobile/src/
├─ app/                    App shell: providers, navigators, AuthGate
├─ core/                   Cross-cutting
│  ├─ config/              env + build-time config
│  ├─ http/                RTK Query root api + baseQuery
│  ├─ native/              vision-camera, RNFS, ML Kit, image-picker, permissions
│  ├─ storage/             Keychain (auth) + MMKV (prefs)
│  ├─ hooks/               typed redux hooks
│  └─ utils/
├─ features/
│  ├─ auth/                {api, screens, state}
│  ├─ capture/             {screens, hooks} — camera + face-detect flow
│  ├─ analysis/            {api, screens, state} — Home + ScanResult
│  ├─ routine/             AM/PM routine screen
│  └─ history/             {api, screens} — timeline + comparison
├─ ui/                     Design system (theme tokens, primitives)
└─ store/                  Root store composition
```

Rules for the folder structure:
- Features never import from other features. If two features need something, promote it to `core/` or `ui/`.
- Native modules are wrapped in `core/native/*` so screens depend on our types, not the vendor package.
- Every feature's server calls go through `injectEndpoints` on the single RTK Query root api in `core/http/api.ts` — that's what gives us global cache invalidation via tags.

## Quick start (backend)

```bash
cd server
npm install
cp .env.example .env       # set GEMINI_API_KEY and change JWT_SECRET
npm run migrate            # optional — server also applies schema on boot
npm run dev                # http://localhost:8080
```

Endpoints:
- `POST /auth/register` `{ email, password }` → `{ token, userId, email }`
- `POST /auth/login`    `{ email, password }` → `{ token, userId, email }`
- `POST /scans`         multipart `photo` → `Scan`
- `GET  /scans`         → `{ scans: ScanSummary[] }`
- `GET  /scans/:id`     → `Scan`
- `GET  /scans/compare/latest` → `Comparison`
- `GET  /photos/*`      → static photo files
- `GET  /health`        → `{ ok: true, ts }`

## Quick start (mobile)

```bash
cd mobile
npm install
# iOS
cd ios && pod install && cd ..
npm run ios
# Android
npm run android
```

Native permissions still need to be declared in `ios/Info.plist` and `android/app/src/main/AndroidManifest.xml` — see [docs/native-setup.md](docs/native-setup.md).

## Stack
- **AI**: Google Gemini 2.5 Flash (free tier, native structured JSON via `responseSchema`)
- **Mobile**: RN CLI 0.76 (New Architecture), vision-camera 4, ML Kit face detection, RNFS, MMKV, Keychain, Redux Toolkit + RTK Query, React Navigation
- **Backend**: Fastify, better-sqlite3 (WAL), sharp (resize + thumb), JWT auth, zod
