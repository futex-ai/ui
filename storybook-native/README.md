# Native Storybook host

A thin Expo app whose only job is to run **on-device Storybook** so the native
(`*.tsx`) component variants can be tested on iOS/Android — the counterpart to
the web Storybook (`.storybook/` + `npm run storybook`), which only ever renders
the `*.web.tsx` code path.

## How it's wired

- The library is linked into this app via `"@firna/ui": "file:.."`. Metro
  resolves `@firna/ui/*` through the package `exports`, and the `react-native`
  condition points at the built **`dist/`** — so the stories render the compiled
  **native** component variants.
- **Stories live in `stories/`** (the canonical SB-RN sibling-folder layout) and
  import from `@firna/ui`, _not_ from the library's `src/stories`. Metro can't
  load source across the project-root boundary (`../../src`), so the library is
  consumed as a package, not as sibling source.
- The Storybook config is in `.rnstorybook/` (Metro resolves the Storybook entry
  from this app's project root, so it can't sit at the repo root next to
  `.storybook/`). `metro.config.js` forces a single copy of `react`/
  `react-native` so the linked library doesn't pull a duplicate.

## Why this is a separate package

The repo-root `package.json` is the published library: its `main` points at
`dist`. An Expo host needs `main` to point at its own app entry, so the two can't
share one `package.json`. None of this folder is published — the library ships
only `dist/` + `README.md`.

## Expo Go vs dev build

The native **Controls** addon (`@storybook/addon-ondevice-controls`) was removed
on purpose: it dragged in `@react-native-community/datetimepicker`, whose **config
plugin** forced a dev build — and these stories don't use a date control. The
`placement` variants are covered by the two explicit stories
(`BottomSheet` / `CenterDialog`) instead of a live args panel.

With that gone, the remaining on-device UI only needs reanimated /
gesture-handler / `@gorhom/bottom-sheet`, which ship in Expo Go — so **Expo Go
should now work** (`npm start`, open in Expo Go). If the on-device UI still fails
to mount (you see only the bare story; the Metro log shows
`storybook-log: error loading UI`), fall back to a **dev build**: `npm run ios:dev`.

## Prerequisites

- **Xcode** + **CocoaPods** (`brew install cocoapods`) for the iOS dev build
  (Android: Android Studio / SDK).
- **watchman** (`brew install watchman`) — Metro's fallback crawler doesn't index
  the linked library reliably.
- The library must be **built** so `dist/` exists (this host consumes the built
  output, not live `src`). The `*:dev` and `storybook:native` scripts run the
  build for you; by hand it's `npm run build` at the repo root. Rebuild after
  changing library code.

## Run it

First time, install deps and build the dev client (this also starts Metro):

```bash
npm install                  # respects .npmrc (legacy-peer-deps) for the SB tree
npx expo install --fix       # align native deps to the installed Expo SDK
npm run ios:dev              # builds + installs the iOS dev client, then serves
```

After the dev client is installed, for normal JS iteration just:

```bash
npm run storybook:native     # builds the lib, then `expo start --dev-client --clear`
```

Open the host on the simulator or device and choose a story in the navigator.
The **Modal / Native sheet** stories exercise native overlays. The **RichText /
Native editor** stories exercise editable, prefilled, and read-only attributed
blocks; focus a block to inspect the iOS input accessory or Android in-frame
formatting toolbar.

## Versions

Targets **Expo SDK 56** (React Native 0.85 + React 19.2, matching the library).
Storybook React Native is on the **v10** major (same as the web Storybook). Run
`npx expo install --fix` to keep native deps pinned to the SDK.

## Status

Bundles successfully for iOS and Android. The rich-text story has also been
interaction-smoked in Expo Go on the iOS simulator, including focus and the
input-accessory toolbar. If Expo Go cannot mount the full navigator for a local
SDK combination, use the **dev build** above.

Notes:

- `.rnstorybook/storybook.requires.ts` is **generated** on first start
  (gitignored); `index.tsx`'s import of it is unresolved until then.
- If `.rnstorybook/index.tsx` ever mismatches the installed v10 API, run
  `npx storybook@latest add` here to regenerate the entry.

## Adding stories

Add a `*.stories.tsx` file in `stories/` that imports components from
`@firna/ui` (e.g. `@firna/ui/modal`). Keep imports on the package, not on
`../../src`, so Metro resolves them through the built package. If a newly added
story doesn't appear, restart with a cleared cache (`npm run storybook:native`
already passes `--clear`).
