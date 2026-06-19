# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.4.0](https://github.com/futex-ai/ui/compare/v0.3.0...v0.4.0) (2026-06-19)

### Features

- **a11y:** WCAG 2.1 AA support across components + axe gate ([#46](https://github.com/futex-ai/ui/issues/46)) ([2bd294b](https://github.com/futex-ai/ui/commit/2bd294b6d6f7efee5b5785c7a683bf08959494a4))
- **list:** vertical list with between-item separators and ListItem row ([#52](https://github.com/futex-ai/ui/issues/52)) ([11211bf](https://github.com/futex-ai/ui/commit/11211bfd444884d108313cbd363cab8de8d707c1))
- **spinner:** add spinning loading indicator ([#49](https://github.com/futex-ai/ui/issues/49)) ([d9d141f](https://github.com/futex-ai/ui/commit/d9d141f025948e9397e39b966a5177ec6b84f844))
- **table:** data table with optional headers and clickable rows ([#48](https://github.com/futex-ai/ui/issues/48)) ([0f93b19](https://github.com/futex-ai/ui/commit/0f93b19e59d4c2d932b089d00638b1ea62ffd8a7))
- **toast:** add solid variant controller ([#47](https://github.com/futex-ai/ui/issues/47)) ([2ae282e](https://github.com/futex-ai/ui/commit/2ae282e0d818b4cbc4518969eae01c3dfa8429d6))
- **typography:** add H1–H5 heading and text component family ([#53](https://github.com/futex-ai/ui/issues/53)) ([406a825](https://github.com/futex-ai/ui/commit/406a8251e7326c682225d11f774d4e3503ef632d))

### Bug Fixes

- restore npm trusted workflow filename ([#44](https://github.com/futex-ai/ui/issues/44)) ([6211e69](https://github.com/futex-ai/ui/commit/6211e696d0f6fd439ad206118f50ca59dfbc70c8))
- **segmented:** default to pill variant, keep outline as opt-in ([#50](https://github.com/futex-ai/ui/issues/50)) ([efbd712](https://github.com/futex-ai/ui/commit/efbd712b366da68b7e8d5ef1da0dc06ed8bbab8d))
- **table:** meet WCAG AA text contrast in example story colors ([#51](https://github.com/futex-ai/ui/issues/51)) ([fa5d743](https://github.com/futex-ai/ui/commit/fa5d74378a32b244e5a563755f32656f74270d08))

## [0.3.0](https://github.com/futex-ai/ui/compare/v0.2.1...v0.3.0) (2026-06-18)

### Features

- **calendar:** add full event calendar view component ([#39](https://github.com/futex-ai/ui/issues/39)) ([879285e](https://github.com/futex-ai/ui/commit/879285eaa10d93e5088b6d90721c1f2f9959c4ce))

## [Unreleased]

## [0.2.1](https://github.com/futex-ai/ui/compare/v0.2.0...v0.2.1) - 2026-06-18

### Added

- _(heatmap)_ add configurable calendar heatmap component ([#40](https://github.com/futex-ai/ui/pull/40))
- _(dropdown)_ add configurable trigger options to DropdownMenu ([#37](https://github.com/futex-ai/ui/pull/37))

### Fixed

- _(dropdown)_ wire menu hover navigation ([#38](https://github.com/futex-ai/ui/pull/38))
- format changelog release notes ([#34](https://github.com/futex-ai/ui/pull/34))

### Other

- Fix missed Firna release recovery ([#35](https://github.com/futex-ai/ui/pull/35))

## [0.2.0](https://github.com/futex-ai/ui/compare/v0.1.1...v0.2.0) - 2026-06-16

### Added

- _(dropdown)_ add ergonomic menu trigger ([#33](https://github.com/futex-ai/ui/pull/33))
- _(toast)_ add toast notification component ([#32](https://github.com/futex-ai/ui/pull/32))
- _(button)_ add per-tone hover states ([#29](https://github.com/futex-ai/ui/pull/29))
- _(segmented)_ [**breaking**] default sizing to content ([#27](https://github.com/futex-ai/ui/pull/27))
- add drag-select provider ([#22](https://github.com/futex-ai/ui/pull/22))

### Fixed

- _(date)_ lift calendar popover layers ([#30](https://github.com/futex-ai/ui/pull/30))
- _(dropdown)_ capture Escape so a menu in a modal keeps the modal open ([#31](https://github.com/futex-ai/ui/pull/31))
- release after squash release PRs ([#25](https://github.com/futex-ai/ui/pull/25))

### Other

- _(dropdown)_ add edge-placement Storybook examples ([#28](https://github.com/futex-ai/ui/pull/28))

## [0.1.1](https://github.com/futex-ai/ui/compare/v0.1.0...v0.1.1) - 2026-06-15

### Added

- _(avatar)_ allow text color override ([#23](https://github.com/futex-ai/ui/pull/23))

## [0.1.0](https://github.com/futex-ai/ui/releases/tag/v0.1.0) - 2026-06-14

### Added

- _(date)_ add spinning wheel date picker variant ([#11](https://github.com/futex-ai/ui/pull/11))
- _(popover)_ add anchored content popover ([#12](https://github.com/futex-ai/ui/pull/12))
- add shared radio cards ([#10](https://github.com/futex-ai/ui/pull/10))
- _(input)_ add shared Input field component ([#13](https://github.com/futex-ai/ui/pull/13))
- _(date)_ add clear button to date input ([#9](https://github.com/futex-ai/ui/pull/9))
- _(dropdown)_ add searchable filter input to dropdown select ([#8](https://github.com/futex-ai/ui/pull/8))
- _(dropdown)_ add header and footer slots to dropdown select ([#7](https://github.com/futex-ai/ui/pull/7))
- _(date)_ add calendar date input component ([#5](https://github.com/futex-ai/ui/pull/5))
- add segmented control ([#3](https://github.com/futex-ai/ui/pull/3))
- add shared UI package

### Fixed

- _(dropdown)_ keep active row visible ([#4](https://github.com/futex-ai/ui/pull/4))
- _(ci)_ force-delete Storybook previews ([#2](https://github.com/futex-ai/ui/pull/2))
- address review accessibility findings

### Other

- clarify manual Firna release flow
- plan Firna npm release
- Add shared switch component ([#6](https://github.com/futex-ai/ui/pull/6))
- limit xtask check to JS suite
- add xtask checks and review
- group Storybook component examples
- accept Cloudflare API token alias
- complete shared UI plan
- choose storybook preview hosting
- add ui preview checks to plan
- plan shared UI components
- init commit
