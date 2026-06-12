# ui

Shared UI component library for Futex React Native and React Native Web
surfaces. The first consumers are the accounting app and the Juno app.

## Key Features

- Shared dropdown, selector, combobox, and modal primitives.
- Themeable visual tokens so consumers can use their own brand primary color.
- Expo and React Native Web compatible platform files.
- Focused unit tests, browser interaction tests, and package export checks.
- Storybook previews for visual review on every PR.

## User-Facing Interface

The package name is `@futex/ui`. Public exports are available from:

- `@futex/ui` for all public components and helpers.
- `@futex/ui/dropdown` for dropdown, selector, combobox, and layer helpers.
- `@futex/ui/modal` for web modal frame, portal, model, and layer helpers.
- `@futex/ui/theme` for `SharedUiThemeProvider`, default accounting-style
  tokens, the Juno token preset, and `createSharedUiTheme`.

## Developer Get Started

```bash
npm ci
npm test
npm run typecheck
npm run build
npm run storybook
npm run storybook:build
npm run test:browser
```

Run the full local verification suite with:

```bash
npm run verify
```

Browser interaction tests start Storybook automatically through Playwright.
Storybook is built to `storybook-static`.

## Storybook Deployments

- Main branch Storybook deploys to Cloudflare Pages project
  `futex-ui-storybook`.
- Main URL: `https://futex-ui-storybook.pages.dev`.
- PR previews deploy to Cloudflare branch `pr-<number>`.
- PR preview URL shape:
  `https://pr-<number>.futex-ui-storybook.pages.dev`.
- PR previews are posted through a sticky comment marked
  `<!-- futex-ui-storybook-preview -->`.
- Required repository variable: `CLOUDFLARE_ACCOUNT_ID`.
- Required repository secret: `CLOUDFLARE_PAGES_API_TOKEN`.

## Key Code Jumping Points

- Shared theme boundary: [src/theme.tsx](src/theme.tsx)
- Dropdown components: [src/dropdown/README.md](src/dropdown/README.md)
- Modal components: [src/modal/README.md](src/modal/README.md)
- Browser tests: [tests/browser/storybook.spec.ts](tests/browser/storybook.spec.ts)
- Shared component protocol:
  [docs/protocol/shared-ui-components.md](docs/protocol/shared-ui-components.md)
- Consumer migration handoff: [docs/consumer-migration.md](docs/consumer-migration.md)
- Active and completed implementation plans: [plans/README.md](plans/README.md)

## Related Repositories

- Accounting consumer/source components:
  `/Users/calummoore/projects/futex/accounting`
- Juno consumer:
  `/Users/calummoore/projects/futex/juno`
