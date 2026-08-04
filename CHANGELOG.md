# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.6.1](https://github.com/futex-ai/ui/compare/v1.6.0...v1.6.1) (2026-08-04)

### Bug Fixes

- **list:** target test IDs at pressables ([#135](https://github.com/futex-ai/ui/issues/135)) ([bcf60ce](https://github.com/futex-ai/ui/commit/bcf60cee2dd2ca0c235563a0f9d4ede032249d3e))

## [1.6.0](https://github.com/futex-ai/ui/compare/v1.5.0...v1.6.0) (2026-08-03)

### Features

- **animated-border:** two-color gradient trail ([#134](https://github.com/futex-ai/ui/issues/134)) ([149fc29](https://github.com/futex-ai/ui/commit/149fc29d9443bb7c3b89dbc10b978595b4f3deeb))

### Bug Fixes

- **button:** keep focus off icon nodes ([#131](https://github.com/futex-ai/ui/issues/131)) ([e49e1a0](https://github.com/futex-ai/ui/commit/e49e1a0c44599a4b91f9df4269eae8c1c8a2592f))
- **switch:** soften the off-track border and drop the knob edge when on ([#133](https://github.com/futex-ai/ui/issues/133)) ([fe75049](https://github.com/futex-ai/ui/commit/fe7504951c2a758459adfe71d9c86a2113c1116e))

## [1.5.0](https://github.com/futex-ai/ui/compare/v1.4.0...v1.5.0) (2026-08-03)

### Features

- **modal:** focus caller content on open, add Button buttonRef ([#129](https://github.com/futex-ai/ui/issues/129)) ([b0ffc25](https://github.com/futex-ai/ui/commit/b0ffc252e1a929cde0f790dd4d79d2998119c009))

## [1.4.0](https://github.com/futex-ai/ui/compare/v1.3.0...v1.4.0) (2026-07-31)

### Features

- **loader:** add loader family with six shapes ([#127](https://github.com/futex-ai/ui/issues/127)) ([225b978](https://github.com/futex-ai/ui/commit/225b978eb29c61170df05b571b793a27ec4960d1))
- **spinner:** honour reduced motion with an opacity fade ([225b978](https://github.com/futex-ai/ui/commit/225b978eb29c61170df05b571b793a27ec4960d1))

### Bug Fixes

- **loader:** emit ARIA range attributes for web progress ([225b978](https://github.com/futex-ai/ui/commit/225b978eb29c61170df05b571b793a27ec4960d1))

## [1.3.0](https://github.com/futex-ai/ui/compare/v1.2.1...v1.3.0) (2026-07-31)

### Features

- **sortable-list:** drag items between lists with SortableGroups ([#125](https://github.com/futex-ai/ui/issues/125)) ([a113762](https://github.com/futex-ai/ui/commit/a113762772f184636e7f39a2143e2c8a2caaef67))

### Bug Fixes

- **sortable-list:** portal the drag ghost to body ([a113762](https://github.com/futex-ai/ui/commit/a113762772f184636e7f39a2143e2c8a2caaef67))

## [1.2.1](https://github.com/futex-ai/ui/compare/v1.2.0...v1.2.1) (2026-07-28)

### Bug Fixes

- **dropdown:** tint row slots with active color ([#123](https://github.com/futex-ai/ui/issues/123)) ([d1bc775](https://github.com/futex-ai/ui/commit/d1bc7757f6d745b261af1eaee30dbb9081616d87))

## [1.2.0](https://github.com/futex-ai/ui/compare/v1.1.0...v1.2.0) (2026-07-27)

### Features

- **data-grid:** make date picker responsive ([#120](https://github.com/futex-ai/ui/issues/120)) ([cff5fbe](https://github.com/futex-ai/ui/commit/cff5fbe647825a4231bb03958329bec7d9b1b3a1))
- **kanban:** column header accessory slot + Space-key a11y fixes ([#122](https://github.com/futex-ai/ui/issues/122)) ([fe47f3a](https://github.com/futex-ai/ui/commit/fe47f3a43e75dea2a109567fbbd1f68ef108abc0))

### Bug Fixes

- **data-grid:** focus multi-select editor ([#119](https://github.com/futex-ai/ui/issues/119)) ([29472c9](https://github.com/futex-ai/ui/commit/29472c90de5ea7a71f46560b32708159f3586c0e))

## [1.1.0](https://github.com/futex-ai/ui/compare/v1.0.0...v1.1.0) (2026-07-22)

### Features

- **data-grid:** add cell loading state ([#117](https://github.com/futex-ai/ui/issues/117)) ([0dd6265](https://github.com/futex-ai/ui/commit/0dd62655eb0312c53280ddb2a75eb618dea3ddea))
- **data-grid:** add per-column loading spinner to the header ([#114](https://github.com/futex-ai/ui/issues/114)) ([d46c19a](https://github.com/futex-ai/ui/commit/d46c19a4c47fba305b9e861e7f8c12956512c3c9))
- **data-grid:** click an already-selected cell to edit it ([#111](https://github.com/futex-ai/ui/issues/111)) ([e9a17dd](https://github.com/futex-ai/ui/commit/e9a17dd1870b85e2672091e2145327065d06a686))
- **data-grid:** Excel-style cell copy/paste (fill, cut, delete, marquee) ([#109](https://github.com/futex-ai/ui/issues/109)) ([e868f1d](https://github.com/futex-ai/ui/commit/e868f1df06e5a658af6c3f45222020eb63deb4b2))
- **data-grid:** muted grey empty zone below rows in a fixed-height body ([#112](https://github.com/futex-ai/ui/issues/112)) ([fd05b78](https://github.com/futex-ai/ui/commit/fd05b78a566230231f59a841e79b78f6971adb06))
- **data-grid:** square corners for in-cell editors ([#113](https://github.com/futex-ai/ui/issues/113)) ([824201e](https://github.com/futex-ai/ui/commit/824201e90cb545ae2bf5c1e6a3ef1f2bf1a5a88c))
- **focus-ring:** add global theme switch + per-component disableFocusRing ([#106](https://github.com/futex-ai/ui/issues/106)) ([048dc1e](https://github.com/futex-ai/ui/commit/048dc1e174c585c051922fc0c12db7f1e1907097))
- **rich-text:** add native mobile editor ([#115](https://github.com/futex-ai/ui/issues/115)) ([26d907c](https://github.com/futex-ai/ui/commit/26d907cde7aa44341cba625fba31a6c16a1e965c))

### Bug Fixes

- **data-grid:** align editor focus styles ([#118](https://github.com/futex-ai/ui/issues/118)) ([1d91290](https://github.com/futex-ai/ui/commit/1d91290f119a78456741f610b9b8621e90335a15))
- **data-grid:** repair multi-select editing ([#116](https://github.com/futex-ai/ui/issues/116)) ([d7c330a](https://github.com/futex-ai/ui/commit/d7c330a3475a234063e5db3e1f46d97b1b34c157))
- **kanban:** portal drag ghost to body ([#110](https://github.com/futex-ai/ui/issues/110)) ([e47302b](https://github.com/futex-ai/ui/commit/e47302bb7aad7a533b320cafa84306cab9461b8d))

## [1.0.0](https://github.com/futex-ai/ui/compare/v0.15.0...v1.0.0) (2026-07-20)

### ⚠ BREAKING CHANGES

- **data-grid:** the DataGrid `square` prop is removed and corners are now square by default. Pass `borderRadius={theme.radii.lg}` for the old rounded look; use `borderWidth={0}` to drop the outer border.

### Features

- **data-grid:** configurable border width + radius (square by default) ([#103](https://github.com/futex-ai/ui/issues/103)) ([50821b6](https://github.com/futex-ai/ui/commit/50821b6b02e5d802ed3965c9ea21e1f2e625bdbb))
- **popover:** add ResponsiveMenu with focus-independent keyboard nav ([#104](https://github.com/futex-ai/ui/issues/104)) ([d977aaf](https://github.com/futex-ai/ui/commit/d977aaf064d06430b619cd5a0a9f845398ac772e))
- **rich-text:** Notion/Linear-style RichTextEditor with markdown output ([#105](https://github.com/futex-ai/ui/issues/105)) ([1da520f](https://github.com/futex-ai/ui/commit/1da520fce0aba0997bc721d15b66fa5b6445e492))
- **sortable-list:** drag-and-drop sortable list with optional grab handle ([#101](https://github.com/futex-ai/ui/issues/101)) ([e0c06b6](https://github.com/futex-ai/ui/commit/e0c06b609e888ea23ed7ca47df658d40d54997f0))

### Bug Fixes

- **data-grid:** open a select cell's menu on a single click when selected ([#100](https://github.com/futex-ai/ui/issues/100)) ([8d372b8](https://github.com/futex-ai/ui/commit/8d372b8345a4889a901b28611abfaa606787c8b6))
- **toast:** remove the tone-colored left accent strip from card toasts ([#99](https://github.com/futex-ai/ui/issues/99)) ([098f242](https://github.com/futex-ai/ui/commit/098f24246c09fedf8c81689775b77ae3e98417b9))

## [0.15.0](https://github.com/futex-ai/ui/compare/v0.14.0...v0.15.0) (2026-07-20)

### Features

- **animated-border:** add circle and pill shape support ([#94](https://github.com/futex-ai/ui/issues/94)) ([342ad43](https://github.com/futex-ai/ui/commit/342ad431a6faae339f72b62f3b88e50e23d593ec))
- **button:** add inline variant for line-height-neutral in-text chips ([#91](https://github.com/futex-ai/ui/issues/91)) ([f6ed248](https://github.com/futex-ai/ui/commit/f6ed24844fe134cf291b02e1aba566b0f6dc3452))
- **data-grid:** add square prop for flat (non-rounded) corners ([#95](https://github.com/futex-ai/ui/issues/95)) ([6c7ea84](https://github.com/futex-ai/ui/commit/6c7ea845eebef9027b20c7cc5502a642069daeca))
- **data-grid:** cap flex column auto-width so sparse grids don't balloon ([#96](https://github.com/futex-ai/ui/issues/96)) ([23aed67](https://github.com/futex-ai/ui/commit/23aed674effb13d8b7cc0a965469e0f816255cb0))
- **data-grid:** resizable columns ([#92](https://github.com/futex-ai/ui/issues/92)) ([415f070](https://github.com/futex-ai/ui/commit/415f0709a9b903d2cf70ec5e6b4c3c1c79889a84))
- **input:** add seamless (invisible) editable variant ([#97](https://github.com/futex-ai/ui/issues/97)) ([29af350](https://github.com/futex-ai/ui/commit/29af350d5572a79767cc2e4f44054fb484fd9837))

### Bug Fixes

- **button:** use the shared focus glow like other controls ([#98](https://github.com/futex-ai/ui/issues/98)) ([cd889fa](https://github.com/futex-ai/ui/commit/cd889fae9cbe26d3e9bfe8aa1ee5d6d242416e27))

## [0.14.0](https://github.com/futex-ai/ui/compare/v0.13.0...v0.14.0) (2026-07-20)

### Features

- unblock ts/app component adoption gaps ([#89](https://github.com/futex-ai/ui/issues/89)) ([925831b](https://github.com/futex-ai/ui/commit/925831bf11aede7aa7e996a2bbe89d048c0269c8))

## [0.13.0](https://github.com/futex-ai/ui/compare/v0.12.0...v0.13.0) (2026-07-19)

### Features

- **testid:** forward testID to the root of every public component ([#87](https://github.com/futex-ai/ui/issues/87)) ([3b5e1c7](https://github.com/futex-ai/ui/commit/3b5e1c7271b367cb901f6e3a8f40c3bb75c7545d))

## [0.12.0](https://github.com/futex-ai/ui/compare/v0.11.0...v0.12.0) (2026-07-16)

### Features

- **focus:** replace outline focus ring with a soft glow ([#85](https://github.com/futex-ai/ui/issues/85)) ([20500b1](https://github.com/futex-ai/ui/commit/20500b1b87e5a0ef85b8ede8322e82294b781ece))

## [0.11.0](https://github.com/futex-ai/ui/compare/v0.10.0...v0.11.0) (2026-07-12)

### Features

- **fields:** add labelInfo help affordance across labelled fields ([#83](https://github.com/futex-ai/ui/issues/83)) ([6b100b2](https://github.com/futex-ai/ui/commit/6b100b20a808c1490b337ed85d596bd0b79e17c5))

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
