# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.10.0](https://github.com/futex-ai/ui/compare/v0.9.0...v0.10.0) (2026-07-10)

### Features

- **popover:** responsive popover + sheet, and nested-overlay dismissal ([#81](https://github.com/futex-ai/ui/issues/81)) ([d578dc8](https://github.com/futex-ai/ui/commit/d578dc8146db227ee6d0e0f8aae599dadbc1696c))

## [0.9.0](https://github.com/futex-ai/ui/compare/v0.8.0...v0.9.0) (2026-07-08)

### Features

- **a11y:** testID-free test targeting for dropdown, radio, segmented ([#76](https://github.com/futex-ai/ui/issues/76)) ([aaea83c](https://github.com/futex-ai/ui/commit/aaea83c777a5177aef76da1cb0a5714494110153))
- **input:** add labelInfo help affordance ([#79](https://github.com/futex-ai/ui/issues/79)) ([73c6e98](https://github.com/futex-ai/ui/commit/73c6e98f8cd5d931dadd67dff571de84ae77c873))
- **input:** auto-growing textarea with numberOfLines + maxLines ([#78](https://github.com/futex-ai/ui/issues/78)) ([3a8530c](https://github.com/futex-ai/ui/commit/3a8530c41038515877aba0a793cfd7d0b795dfad))
- **modal:** add native iOS/Android bottom sheet + on-device Storybook ([#74](https://github.com/futex-ai/ui/issues/74)) ([d36ec20](https://github.com/futex-ai/ui/commit/d36ec20993b2ed3e664916ec546d2784fa0d3d83))
- **modal:** animate web bottom-sheet height to fit content ([#77](https://github.com/futex-ai/ui/issues/77)) ([cb67364](https://github.com/futex-ai/ui/commit/cb673648c77c50348732b1c956f4015d63e36d92))

## [0.8.0](https://github.com/futex-ai/ui/compare/v0.7.0...v0.8.0) (2026-07-01)

### Features

- **animated-border:** add animated comet-trail border primitive ([#70](https://github.com/futex-ai/ui/issues/70)) ([d82e469](https://github.com/futex-ai/ui/commit/d82e469b381fe021136afb6fba3158d41d1456f8))
- **data-grid:** editable Airtable-style DataGrid primitive ([#73](https://github.com/futex-ai/ui/issues/73)) ([b4e61b8](https://github.com/futex-ai/ui/commit/b4e61b8b6926e528f3d1da40f3d2958054a6fa92))
- **kanban:** add drag-and-drop board component ([#71](https://github.com/futex-ai/ui/issues/71)) ([c6df6be](https://github.com/futex-ai/ui/commit/c6df6be3745f817ee53bc97820f8ac9864ca522d))
- **workflow:** add branching workflow builder ([#72](https://github.com/futex-ai/ui/issues/72)) ([fc33199](https://github.com/futex-ai/ui/commit/fc33199f3046dbd6e66b4105e69e95a29b2f8171))

### Bug Fixes

- **dropdown:** add legible trailing `rightText` for the solid active fill ([#68](https://github.com/futex-ai/ui/issues/68)) ([d073fc6](https://github.com/futex-ai/ui/commit/d073fc619fd25e23d9422032e86d0337bd48108f))

## [0.7.0](https://github.com/futex-ai/ui/compare/v0.6.0...v0.7.0) (2026-06-22)

### Features

- **segmented:** slide the pill thumb between tabs ([#65](https://github.com/futex-ai/ui/issues/65)) ([f504eb5](https://github.com/futex-ai/ui/commit/f504eb54cef07f0250f629356347a23a3c0ac338))

### Bug Fixes

- **dropdown:** keep row subtext legible on the solid active highlight ([#67](https://github.com/futex-ai/ui/issues/67)) ([0308f86](https://github.com/futex-ai/ui/commit/0308f8694daaac6a2affe865bce36ac90e663017))

## [0.6.0](https://github.com/futex-ai/ui/compare/v0.5.0...v0.6.0) (2026-06-21)

### Features

- **input:** add textarea field ([#63](https://github.com/futex-ai/ui/issues/63)) ([8e58891](https://github.com/futex-ai/ui/commit/8e58891909e1b1f7350e6c4edb1dd442b730099f))
- **table:** add rowStyle hook and bold TableCell variant ([#64](https://github.com/futex-ai/ui/issues/64)) ([b087700](https://github.com/futex-ai/ui/commit/b08770099a42d7aa75e5650aa9d2e5803d4cc2cf))
- **theme:** use translucent ink for control borders so they blend & lighten ([#61](https://github.com/futex-ai/ui/issues/61)) ([de51edc](https://github.com/futex-ai/ui/commit/de51edcc5d38a9cc3f434a4e783bea33270be620))

## [0.5.0](https://github.com/futex-ai/ui/compare/v0.4.0...v0.5.0) (2026-06-21)

### Features

- **badge:** add status badge with tone, variant, and size ([#58](https://github.com/futex-ai/ui/issues/58)) ([f1065fb](https://github.com/futex-ai/ui/commit/f1065fb3d1a15977a1b6983f8ca6cac8f31fe4b2))
- **dropdown:** add selectable option-highlight variants (solid default) ([#60](https://github.com/futex-ai/ui/issues/60)) ([22904b8](https://github.com/futex-ai/ui/commit/22904b81746b24c3fe69e7b5c8d41358490d18fa))
- **skeleton:** add loading skeleton primitives and Table/List loading states ([#55](https://github.com/futex-ai/ui/issues/55)) ([ac599d5](https://github.com/futex-ai/ui/commit/ac599d5d500b5df0cbc934bb158ba72ef8d84e5d))

### Bug Fixes

- **dropdown:** reposition open menu surface on scroll ([#59](https://github.com/futex-ai/ui/issues/59)) ([752519d](https://github.com/futex-ai/ui/commit/752519defee9f95c0b48ca16b795f0436e90997c))
- **theme:** lighten control border for white backgrounds ([#56](https://github.com/futex-ai/ui/issues/56)) ([7393f2f](https://github.com/futex-ai/ui/commit/7393f2fd03fc99b1139ea7d397c79b4f46ade740))

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
