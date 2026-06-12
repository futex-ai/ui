# ui

Shared UI component library for Futex React Native and React Native Web
surfaces. This repository is being prepared to host common components used by
the accounting app and the Juno app.

## Key Features

- Shared dropdown, selector, combobox, and modal primitives.
- Themeable visual tokens so consumers can use their own brand primary color.
- Expo and React Native Web compatible platform files.
- Focused tests for pure interaction behavior and package export contracts.
- PR CI checks, browser interaction tests, and Storybook previews for visual
  review.

## User-Facing Interface

The package interface is still being planned. The first intended exports are:

- Dropdown selectors and lists copied from accounting.
- Input-backed combobox popovers and multi-select controls copied from
  accounting.
- Web modal frame and portal components copied from accounting.
- Theme provider and default token set for consumer brand overrides.

## Developer Get Started

This repo currently contains planning and protocol documentation only. Once the
package scaffold lands, this section should include the exact install, build,
test, browser interaction test, Storybook, and smoke-test commands.

## Key Code Jumping Points

- Shared component protocol: [docs/protocol/shared-ui-components.md](docs/protocol/shared-ui-components.md)
- Active and completed implementation plans: [plans/README.md](plans/README.md)

## Related Repositories

- Accounting consumer/source components:
  `/Users/calummoore/projects/futex/accounting`
- Juno consumer:
  `/Users/calummoore/projects/futex/juno`
