# Releases and deployments

These sections extend the [root README](../README.md).

## Package Releases

- Release-please opens and updates the release PR for `@firna/ui` from
  Conventional Commits.
- The release PR updates `CHANGELOG.md`, `package.json`, and
  `package-lock.json` through release-please's `node` release type.
- When release-please creates or updates a release PR, the release workflow
  checks out that generated PR branch, runs `npm run format`, and pushes a
  `chore: format release PR` commit only if the generated files need Prettier
  cleanup.
- Merging the release PR lets release-please create the `vX.Y.Z` tag and GitHub
  release. Ordinary non-release pushes to `main` only update the release PR.
- npm publishing runs in the same `.github/workflows/release-plz.yml` invocation
  that creates the GitHub release, using npm trusted publishing. The npm package
  must configure this repository and `release-plz.yml` as the
  trusted publisher, with allowed action `npm publish`.
- The workflow file keeps the historical `release-plz.yml` filename because npm
  trusted publishing validates the workflow filename configured on npmjs.com.
  The workflow implementation itself uses release-please.
- The workflow falls back to `GITHUB_TOKEN` for release-please, but a
  repository secret named `RELEASE_PLEASE_TOKEN` can be added if release PRs
  need to trigger normal PR checks.
- Before publishing, the release workflow installs dependencies, installs the
  Playwright browser, verifies the release tag matches `package.json`, runs
  `cargo xtask check`, and skips publishing if the version already exists on
  npm.
- If publish fails after the GitHub release was created, manually dispatch the
  release workflow with `publish_ref` set to the existing `vX.Y.Z` tag. The
  retry path checks out that tag and runs the same verification and publish
  steps.
- Scoped npm packages default to private, so `publishConfig.access` is set to
  `public`.

## Storybook Deployments

- Main branch Storybook deploys to Cloudflare Pages project
  `futex-ui-storybook`.
- Main URL: `https://futex-ui-storybook.pages.dev`.
- Same-repository non-release PR previews deploy to Cloudflare branch
  `pr-<number>`.
- PR preview URL shape:
  `https://pr-<number>.futex-ui-storybook.pages.dev`.
- PR previews are posted through a sticky comment marked
  `<!-- futex-ui-storybook-preview -->`.
- Release Please PRs are skipped by the Storybook preview deploy job; their
  component changes were already previewed in the source PRs.
- Closing a same-repository PR marks the sticky comment inactive and attempts
  to delete aliased preview deployments for that PR branch; if Cloudflare
  cleanup cannot complete safely, the comment reports the retained reason.
- Storybook examples are grouped under one top-level folder per family:
  `AnimatedBorder/Examples`, `Avatar/Examples`, `Badge/Examples`,
  `Button/Examples`, `Calendar/Examples`, `Chart/BarChart`, `Chart/Comparison`,
  `Chart/Foundations`, `Chart/LineChart`, `Chart/Palette`, `Chart/PartToWhole`,
  `Chart/SmallMultiples`, `Chart/StatTile`, `DataGrid/Examples`,
  `Date/Examples`, `Drag Select/Examples`, `Dropdown/Examples`,
  `Empty state/Examples`, `Focus ring/Examples`, `Heatmap/Examples`,
  `Input/Examples`, `Kanban/Examples`, `Link/Examples`, `List/Examples`,
  `Loader/Examples`, `Modal/Examples`, `Notice/Examples`,
  `Panel resize/Examples`, `Popover/Examples`, `Primitives/Examples`,
  `Primitives/Interaction`, `Primitives/Layout`, `Primitives/Scrolling`,
  `Radio/Examples`, `RichText/Examples`, `RichText/Collaboration`,
  `Segmented/Examples`, `Sheet/Examples`, `Skeleton/Examples`,
  `SortableList/Examples`, `Spinner/Examples`, `Status dot/Examples`,
  `Switch/Examples`, `Table/Examples`, `Theme/Examples`, `Timeline/Examples`,
  `Toast/Examples`, `Touch surface/Examples`, `Typography/Examples`,
  `Video editor/Examples` (whose `Full editor` story assembles the whole family
  into a working editor, in light, dark, and compact), and `Workflow/Examples`.
- Required repository variable: `CLOUDFLARE_ACCOUNT_ID`.
- Required repository secret: `CLOUDFLARE_PAGES_API_TOKEN` or
  `CLOUDFLARE_API_TOKEN`.
