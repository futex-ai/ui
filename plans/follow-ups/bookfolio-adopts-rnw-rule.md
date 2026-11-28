# Bookfolio adopts the react-native-web rule

- **Severity:** Medium. **Effort:** Medium. **Confidence:** High. **Harder later:** No.
- **Kind:** Post-merge task.
- **Added:** 2026-11-28, from the branch `calummoore/firna-rnw-seam-contract-mhsd`, its post-merge task "Bookfolio adopts the release".
- **Location:** None in this repository. The work is in `futex-ai/accounting`: `ts/app/scripts/metro-firna-resolver.cjs`, `ts/app/metro.config.js`, `ts/app/src/__tests__/webPlatformResolution.test.ts`, `ts/app/src/__tests__/browser/metroWebBundle.ts`, `ts/app/src/__tests__/support/webPlatformResolution.mjs`, `ts/app/src/lucideWebIconRuntime.ts`, and `ts/package.json` with its lock file.
- **Reason:** The work changes another repository, and it needs the release of `@firna/ui` that this branch makes.

- **Terms:**
  - **Bookfolio:** the Expo web app in `futex-ai/accounting`. It draws its own screens with `react-native-web` (RNW).
  - **RNW route:** an app that draws with RNW applies the rule of `@firna/ui/rnw`, and Firna then draws with RNW too. `README.md` section "React Native Web route" and `docs/protocol/shared-ui-package.md` section "React Native Web Contract" state it.
  - **The rule:** `resolveFirnaRnwFile(fromFile, request)` from `@firna/ui/rnw`. It returns the file of the RNW form of a Firna seam, or `null`.
- **Background:**
  - Bookfolio pins `@firna/ui` `^4.0.0`. Its resolver `ts/app/scripts/metro-firna-resolver.cjs` sends `primitives/icons`, `primitives/reactNative`, and `primitives/svg` to their native files on web. Three test helpers keep their own copies of that list: `webPlatformResolution.test.ts`, the esbuild plugin in `metroWebBundle.ts`, and the Node hook in `support/webPlatformResolution.mjs`.
  - From the release that this branch makes, the next minor release after 5.2.0, the rule routes only `reactNative`. `svg` and `icons` keep their web files on the RNW route, so they draw SVG with DOM `<svg>` and icons with `lucide-react`. On the RNW route, no public subpath loads a module of Firna's DOM backend.
  - The supported RNW versions are `>=0.21.3 <0.22`. RNW 0.21.2 does not export `InputAccessoryView`, which Firna's native `reactNative` seam re-exports, so esbuild and Node reject it. Bookfolio's `ts/package-lock.json` pins 0.21.2.
  - `firnaIconNames` from `@firna/ui/rnw` gives, for each public subpath, the Lucide names that it can draw on `web` and on `native`. Bookfolio curates its web icons by aliasing both Lucide package roots to `ts/app/src/lucideWebIconRuntime.ts`, which holds 13 icons. `firnaIconNames["@firna/ui/list"].web` is `["ArrowUpRight"]`, which that module lacks, so a new-tab link row throws today.
  - The README says that only Metro needs the curated alias: esbuild with no alias keeps only the glyphs that a bundle draws.
  - Bookfolio has not taken the breaking drag-select changes of 5.0.0.
- **Task:**
  1. Update `@firna/ui` to the release that holds `@firna/ui/rnw`, and take the breaking changes of 5.0.0 on the way.
  2. Update `react-native-web` to 0.21.3 or later inside `<0.22`.
  3. In `metro.config.js`, replace `resolveFirnaWebPrimitive` with the rule, as the README's Metro example shows. Delete `scripts/metro-firna-resolver.cjs`.
  4. Replace the three test copies of the seam list with the rule: the esbuild plugin and the Node hook as the README shows, and delete the test of the old resolver.
  5. On web, stop routing Firna's icons and SVG to `lucide-react-native` and `react-native-svg`. Curate `lucide-react` in Metro with the `web` lists of `firnaIconNames` for each Firna subpath that the app imports.
  6. Run Bookfolio's web tests and its Metro web build. Check a `List` with a new-tab link row on an admin page.
- **Impact if no action:** Bookfolio keeps four copies of a seam list that no longer matches Firna, and each admin page that renders a `List` keeps loading about 80 KB minified of Firna's DOM backend.
- **Needs:** the merged release of `@firna/ui` on npm, and work in `futex-ai/accounting`.
- **Done when:** Bookfolio imports `resolveFirnaRnwFile` in Metro and in its test harnesses, keeps no list of Firna's seams, and its web build of an admin page with a `List` loads no module under `primitives/dom/`.
