# Architecture

## One-scan flow

```
[Capture Screen]
    ├─ vision-camera takePhoto()  ─── or ──  react-native-image-picker
    │                                  │
    ▼                                  ▼
[useCapture hook]
    ├─ ML Kit face detection (on device) — one face, eyes open, centered
    │       ok=false → show hint, no server call
    │       ok=true  → continue
    ▼
[RTK Query useCreateScanMutation]
    ├─ multipart POST /scans (photo)
    ▼
[server /scans handler]
    ├─ sharp: resize + thumbnail, write to /photos/{userId}/{scanId}.jpg
    ├─ Gemini 2.5 Flash with responseSchema → { analysis, routine } JSON
    ├─ insert into `scans` table
    ▼
[Scan payload returned]
    ├─ mobile persists local copy via RNFS  (offline access)
    ▼
[ScanResult screen + Routine screen render]
```

## Progress tracking flow

```
[History screen] → useCompareLatestQuery()
    │
    ▼
[server /scans/compare/latest]
    ├─ pull earliest scan (baseline) + latest scan for user
    ├─ Gemini call with only the two analysis JSON blobs (no photo)
    │       cheaper + faster than re-vision
    ▼
[Comparison { improvementScore, perConditionDelta, narrative }]
```

## Key architectural choices

1. **Single RTK Query root api** (`core/http/api.ts`) with `injectEndpoints` per feature. Gives us a global cache and tag-based invalidation without importing feature APIs from one another.
2. **Face check runs before the network call.** ML Kit is free, on-device, and takes <100ms. Blocking bad photos before we spend a Gemini call keeps the free tier alive and gives users an instant hint.
3. **Server owns Gemini keys.** The mobile app never sees the API key — it hits our Fastify server, which proxies. That's also where we enforce rate limits later.
4. **Photos stored on both sides.** Server has the source of truth for history/comparison; mobile keeps a local copy in `DocumentDirectory/scans/` for offline history browsing.
5. **Structured JSON via `responseSchema`.** No brittle prompt-parsing. Gemini enforces the schema and we `JSON.parse` with confidence.
6. **Auth stored in Keychain, prefs in MMKV.** Never mix the two — MMKV is fast but not encrypted at rest.
