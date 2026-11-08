# Mockups

The mockups are the visual spec of the library parts in use. A
[Mokly](https://www.npmjs.com/package/@mokly/mokly) catalogue draws each
screen at phone and desktop sizes, in the default light and dark library
themes. The screens compose the real `@firna/ui` components, so the mockups
show the library as it renders. The
[app shell parts protocol](../protocol/app-shell-parts.md) holds the
requirements of the parts that the catalogue shows, and each entry links it.

## Commands

Run these from the repository root. Mokly needs Node 22.15 or newer, but not
Node 23 and not Node 24.14 to 24.18.

| Command                     | What it does                                                                 |
| --------------------------- | ---------------------------------------------------------------------------- |
| `npm run mockups:serve`     | Serve the catalogue, watch edits, and show the changes against `origin/main` |
| `npm run mockups:check`     | Run the type check, then the strict build                                    |
| `npm run mockups:typecheck` | Type-check the catalogue sources                                             |
| `npm run mockups:build`     | Validate every view in strict mode, and write `.context/mockups/static/`     |

These commands are local. `npm run verify` and CI do not run them. Git
ignores the build output. Each built view is at
`.context/mockups/static/static/mokly-generated/<path>/index.{mobile,desktop}[.dark].html`.

## How the catalogue reads the library

- `mokly.config.json` at the repository root names the entry root
  `src/entries/`, the renderer `src/render.tsx`, and the two colour schemes.
- The screens import `@firna/ui/*` as a consumer does. `tsconfig.json` maps
  those specifiers to the working-tree `src/`, and the Mokly configuration
  prefers the `.web` files, as Storybook does. So the catalogue draws the
  current source and needs no package build.
- The renderer wraps each screen in the library theme of its scheme, writes
  `domBackendCss` and the theme as `--ui-*` CSS variables into the view, and
  loads Inter from `@fontsource/inter`.

## Surfaces

- A screen marks its surface: `DesktopSurface` or `PhoneSurface` in
  `src/components/common/Surface.tsx`. Nothing reads the viewport width.
- A desktop surface wraps its screen in the library `TextScaleProvider` with
  the compact scale, and its controls take the `xs` size.
- A phone surface wraps its screen in the library `TouchSurface`. Its
  controls and rows are 44 px targets, whatever their size, and its text
  keeps the default scale.
- `src/theme.ts` reads the layout numbers from the library: the control
  height, the row padding and text, and the text roles of each surface. The
  renderer writes them as CSS variables for each `data-surface`, so the
  headings, labels, and row content of the layout line up with the parts.
- `src/design/panelWidths.ts` holds the panel widths and their bounds.

## The catalogue

| Path                 | What it shows                                                   |
| -------------------- | --------------------------------------------------------------- |
| `workspace`          | A project at rest, with every new part                          |
| `workspace/density`  | Dense form controls and text, then a field error                |
| `workspace/links`    | Link buttons and link tabs, then keyboard focus on a tab        |
| `workspace/feedback` | Neutral and urgent notices, and page and panel empty states     |
| `workspace/menus`    | An open dense menu and its phone sheet, then a menu of choices  |
| `workspace/panels`   | The panel resize handle under the pointer, dragged, and focused |

A page shows at most five screens, saved states included. A folder with child
folders shows only its canonical screen, as `workspace` does.

## Folder layout

| Folder or file           | Contents                                                        |
| ------------------------ | --------------------------------------------------------------- |
| `src/entries/`           | The Mokly root: entry modules and folder records                |
| `src/screens/`           | One component for each app screen, for both viewports           |
| `src/components/parts/`  | Library controls and rows with catalogue links and drawn states |
| `src/components/layout/` | Columns, bars, phone headers, and sections                      |
| `src/components/common/` | Surfaces, drawn interaction states, and small helpers           |
| `src/fixtures/`          | Sample projects, files, changes, and activity                   |
| `src/design/`            | The panel widths and their bounds                               |

## How a screen is built

- A screen component in `src/screens/` takes its state and the viewport, and
  draws a real phone layout, not a squeezed desktop one.
- An entry module exports one `defineScreen` with a named export. Its props
  and saved states (`variants`) choose the state, which
  `src/screens/projectState.ts` declares as a schema, so `mockups:serve`
  offers a control for each part of it.
- A library link, such as `LinkButton`, `LinkTabs`, or a `List` navigation
  row, takes `href={mockLink(path)}`. It renders a real anchor to that
  screen. Another library control becomes a link through `MockLink asChild`.
- A view runs no script. A screen draws the pointer over a control, keyboard
  focus, an open menu, or a dragged handle through public props and styles,
  such as `style`, `lineStyle`, `gripStyle`, `open`, and `activeId`.
  `src/components/common/drawnState.ts` holds the drawn styles.
- A desktop menu is the library `InlineMenu`, drawn open beside its trigger.
  A phone menu is the library `InlineMenuSheet`, drawn open in the phone.
- Layout styles are CSS Modules beside their component. They read only the
  theme and surface variables.
- A library control without a handler renders as disabled, so the screens
  pass `noop` from `src/noop.ts`.
- `tests/unit/noAccentBar.test.ts` reads every file under `docs/mockups`. Draw
  a column divider as the right border of the column before it.

The three hand-written HTML mockups stay beside `src/`. Mokly does not read
them.
