# Avatar rounded square

Give [`Avatar`](../src/avatar/Avatar.tsx) a first-class `shape` prop so it can
render a **rounded square** as well as the circular disc it renders today. The
square's corner radius scales with `size` from a new themeable ratio token, so a
rounded square looks identical at 24px and at 64px.

**Status:** Not started. Design agreed (see [Design](#design)); M1 and M2 below.

> **For agentic workers:** use `superpowers:subagent-driven-development` or
> `superpowers:executing-plans` to work through this plan task by task. Steps use
> checkbox (`- [ ]`) syntax for tracking.

---

## Background — how the avatar is shaped today

[`Avatar`](../src/avatar/Avatar.tsx) hardcodes its circular radius inline at
L71–76:

```tsx
style={[
  styles.avatar,
  { borderRadius: size / 2, height: size, width: size },
  solid ? styles.avatarSolid : styles.avatarSoft,
  style,
]}
```

Two consequences matter here:

1. There is **no shape control**. The protocol contract
   ([`docs/protocol/shared-ui-components.md`](../docs/protocol/shared-ui-components.md)
   L282–294) actively mandates a circle: _"Render a circular disc…"_,
   _"Drive the diameter, the circular radius, and the initials' font size from a
   single `size` prop"_. That contract text has to change, not just the code.
2. Because `style` merges **last** in that array, a consumer can already write
   `style={{ borderRadius: 8 }}` and get a rounded square. That escape hatch is
   undocumented, does not scale with `size`, and is not part of the contract —
   this plan makes the behaviour first-class, and keeps the escape hatch working.

The repo already has shape-prop precedent to follow rather than invent:

- [`Button`](../src/button/Button.tsx) L47: `export type ButtonShape = "circle" | "rounded" | "square"`,
  where `square` means _a 1:1 box with rounded corners_ — the vocabulary this
  plan reuses.
- [`AnimatedBorder`](../src/animated-border/AnimatedBorder.tsx) keeps its shape
  type and geometry in a **pure sibling module**
  ([`animatedBorderGeometry.ts`](../src/animated-border/animatedBorderGeometry.ts) L16)
  and re-exports the type through the component. This plan mirrors that layout so
  the radius math is unit-testable without a renderer.

---

## Design

### Public API

```ts
export type AvatarShape = "circle" | "square";
```

`shape?: AvatarShape` defaults to `"circle"`, so every existing call site
(including the Kanban and List avatars) is unchanged. `"square"` is a 1:1 box
with proportionally rounded corners, matching `ButtonShape`'s meaning of
`square`.

### Radius math lives in a pure module

New file `src/avatar/avatarRadius.ts` owns the type and one pure function.
`Avatar.tsx` then imports it and drops its inline `size / 2`.

### Theme token

`SharedUiRadii` ([`src/theme.tsx`](../src/theme.tsx) L66–73) gains
`avatarRatio: number`, defaulting to `0.25` — 24px → 6, 32 → 8, 48 → 12,
64 → 16. It carries the explicit `Ratio` suffix because every other key in that
bag is a pixel value.

`createSharedUiTheme` (L138–147) spreads `defaultSharedUiTheme.radii` before the
overrides, so `junoSharedUiTheme` (L168) and every consumer override inherit the
default with no edit. `SharedUiThemeProvider` accepts
`SharedUiThemeOverrides | SharedUiTheme` (L154) and `SharedUiThemeOverrides.radii`
is `Partial`, so a consumer passing a theme object literal that omits
`avatarRatio` still typechecks via the overrides arm of the union. Only code that
explicitly annotates `const t: SharedUiTheme = { … }` must add the key; there is
no such code in this repo.

### Out of scope

- No per-instance numeric radius prop — `style={{ borderRadius }}` already covers
  the one-off case and keeps working.
- No image/photo avatars.
- No changes to the Kanban ([`KanbanCard.tsx`](../src/kanban/KanbanCard.tsx) L23)
  or List ([`ListItem.tsx`](../src/list/ListItem.tsx) L37) avatar slots — they
  keep circles by default.

---

## Global constraints

- **Ordering:** object keys and component props in this repo are written in
  alphabetical order (see `AvatarProps` L11–35 and `defaultSharedUiTheme.colors`).
  `avatarRatio` sorts **first** in `radii`; `shape` sorts **before** `size` in
  `AvatarProps` and in the destructured parameter list.
- **Gate:** `npm run verify` (= `cargo xtask check`, see `xtask/src/check.rs` L9)
  runs `format:check → test → typecheck → build → test:package → storybook:build → test:browser`.
- **Browser tests** boot their own Storybook via `playwright.config.ts` L16–21 on
  port `6006`. If another workspace already holds that port, run with
  `STORYBOOK_PORT=6007 npm run test:browser`.
- **Storybook story ids** are derived from the export name, so `export const Shapes`
  in `avatar.stories.tsx` (title `Avatar/Examples`) resolves to
  `avatar-examples--shapes`.
- **Commits** use Conventional Commits with a title of 50 characters or fewer.

---

## File structure

| File                                                                                  | Responsibility                                        |
| ------------------------------------------------------------------------------------- | ----------------------------------------------------- |
| `src/avatar/avatarRadius.ts` (**create**)                                             | `AvatarShape` type + `avatarBorderRadius()` pure math |
| `src/avatar/Avatar.tsx` (modify)                                                      | New `shape` prop; delegates radius to the helper      |
| `src/avatar/index.ts` (modify)                                                        | Re-export the new module                              |
| `src/theme.tsx` (modify)                                                              | `radii.avatarRatio` type + default                    |
| `tests/unit/avatarRadius.test.ts` (**create**)                                        | Behavioural tests for the pure math                   |
| `tests/unit/avatar.test.ts` (modify)                                                  | Source assertions for the new wiring                  |
| `tests/unit/theme.test.ts` (modify)                                                   | Default token assertion                               |
| `src/stories/avatar.stories.tsx` (modify)                                             | `Shapes` story across sizes and tones                 |
| `tests/browser/storybook.spec.ts` (modify)                                            | Computed `border-radius` assertions                   |
| `src/avatar/README.md`, `docs/protocol/shared-ui-components.md`, `README.md` (modify) | Docs + contract                                       |

---

## Milestones

### M1 — `shape` prop, pure radius module, theme token

The functional feature end to end: after this milestone `<Avatar shape="square" />`
renders a themeable rounded square and the unit suite is green.

**Interfaces produced (M2 relies on these names):**

```ts
// src/avatar/avatarRadius.ts
export type AvatarShape = "circle" | "square";
export function avatarBorderRadius(
  size: number,
  shape: AvatarShape,
  ratio: number,
): number;

// src/theme.tsx
type SharedUiRadii = { avatarRatio: number /* …existing keys */ };

// src/avatar/Avatar.tsx
type AvatarProps = { shape?: AvatarShape /* …existing props */ };
```

- [ ] **Step 1 — Write the failing unit test.** Create
      `tests/unit/avatarRadius.test.ts`:

  ```ts
  import assert from "node:assert/strict";
  import test from "node:test";

  import { avatarBorderRadius } from "../../src/avatar/avatarRadius";

  test("circle avatars are always half the diameter", () => {
    assert.equal(avatarBorderRadius(32, "circle", 0.25), 16);
    assert.equal(avatarBorderRadius(64, "circle", 0.25), 32);
    // The ratio is irrelevant to a circle.
    assert.equal(avatarBorderRadius(32, "circle", 0.4), 16);
  });

  test("square avatars scale their corner radius with size", () => {
    assert.equal(avatarBorderRadius(24, "square", 0.25), 6);
    assert.equal(avatarBorderRadius(32, "square", 0.25), 8);
    assert.equal(avatarBorderRadius(48, "square", 0.25), 12);
    assert.equal(avatarBorderRadius(64, "square", 0.25), 16);
  });

  test("square avatars honour a themed ratio", () => {
    assert.equal(avatarBorderRadius(40, "square", 0.1), 4);
    assert.equal(avatarBorderRadius(40, "square", 0.35), 14);
  });

  test("square avatars clamp a bad ratio into [0, 0.5]", () => {
    // Above 0.5 the box would read as a circle; below 0 it is not renderable.
    assert.equal(avatarBorderRadius(32, "square", 0.9), 16);
    assert.equal(avatarBorderRadius(32, "square", -1), 0);
    assert.equal(avatarBorderRadius(32, "square", Number.NaN), 0);
  });
  ```

- [ ] **Step 2 — Run it and watch it fail.**

  Run: `npm run test -- --test-name-pattern="avatar"`
  (or the single file: `node --import tsx --test tests/unit/avatarRadius.test.ts`)

  Expected: FAIL — `Cannot find module '../../src/avatar/avatarRadius'`.

- [ ] **Step 3 — Write the module.** Create `src/avatar/avatarRadius.ts`:

  ```ts
  /**
   * Corner-radius geometry for {@link Avatar}. Kept as a pure sibling module —
   * like `animatedBorderGeometry.ts` — so the shape math is unit-testable
   * without a renderer.
   */

  /**
   * `circle` is a full disc; `square` is the same 1:1 box with proportionally
   * rounded corners. Mirrors `ButtonShape`'s meaning of `square`.
   */
  export type AvatarShape = "circle" | "square";

  /** Above half the box a "rounded square" is just a circle, so clamp there. */
  const MAX_RATIO = 0.5;

  /**
   * Resolve the avatar's `borderRadius` in pixels. A `circle` is always half the
   * diameter. A `square` scales its radius with `size` from the theme's
   * `radii.avatarRatio`, so the corner looks identical at every size; the ratio
   * is clamped to `[0, 0.5]` so a bad theme override cannot render a negative
   * corner, an accidental disc, or `NaN`.
   */
  export function avatarBorderRadius(
    size: number,
    shape: AvatarShape,
    ratio: number,
  ): number {
    if (shape === "circle") return size / 2;
    const clamped = Number.isFinite(ratio)
      ? Math.min(Math.max(ratio, 0), MAX_RATIO)
      : 0;
    return size * clamped;
  }
  ```

- [ ] **Step 4 — Run the test and watch it pass.**

  Run: `node --import tsx --test tests/unit/avatarRadius.test.ts`
  Expected: PASS, 4 tests.

- [ ] **Step 5 — Add the failing theme-token test.** Append to
      `tests/unit/theme.test.ts` (it already imports `defaultSharedUiTheme` and
      `junoSharedUiTheme`):

  ```ts
  test("radii expose the avatar rounded-square ratio", () => {
    assert.equal(defaultSharedUiTheme.radii.avatarRatio, 0.25);
    // Themes built through createSharedUiTheme inherit the default token.
    assert.equal(junoSharedUiTheme.radii.avatarRatio, 0.25);
  });
  ```

- [ ] **Step 6 — Run it and watch it fail.**

  Run: `node --import tsx --test tests/unit/theme.test.ts`
  Expected: FAIL — `avatarRatio` is `undefined`.

- [ ] **Step 7 — Add the token.** In [`src/theme.tsx`](../src/theme.tsx), add
      `avatarRatio` as the first key of `SharedUiRadii` (L66–73):

  ```ts
  export type SharedUiRadii = {
    /**
     * Corner radius of `Avatar`'s `shape="square"` as a fraction of its `size`,
     * clamped to `[0, 0.5]`. A ratio rather than a pixel value so a rounded
     * square looks identical at every avatar size.
     */
    avatarRatio: number;
    lg: number;
    md: number;
    pill: number;
    sm: number;
    xl: number;
    xxl: number;
  };
  ```

  …and as the first key of `defaultSharedUiTheme.radii` (L125–132):

  ```ts
  radii: {
    avatarRatio: 0.25,
    lg: 10,
    md: 8,
    pill: 999,
    sm: 6,
    xl: 12,
    xxl: 14,
  },
  ```

  Nothing else in `theme.tsx` changes: `createSharedUiTheme` (L141–147) already
  spreads `defaultSharedUiTheme.radii` before `overrides.radii`, so
  `junoSharedUiTheme` (L168, whose `radii` override omits `pill` today) picks the
  new token up for free.

- [ ] **Step 8 — Run it and watch it pass.**

  Run: `node --import tsx --test tests/unit/theme.test.ts`
  Expected: PASS.

- [ ] **Step 9 — Update the Avatar source assertions to the new wiring.** In
      `tests/unit/avatar.test.ts`, the test at L25–32 currently asserts
      `/borderRadius: size \/ 2/`, which this change deletes from `Avatar.tsx`.
      Replace that test body with:

  ```ts
  test("avatar sizes the disc and initials from the size prop", () => {
    const source = readSource("../../src/avatar/Avatar.tsx");

    assert.match(source, /size = 32/);
    assert.match(source, /shape = "circle"/);
    // Whitespace-tolerant: the call sits right on Prettier's 80-column limit,
    // so it may be formatted on one line or wrapped across four.
    assert.match(
      source,
      /avatarBorderRadius\(\s*size,\s*shape,\s*theme\.radii\.avatarRatio,?\s*\)/,
    );
    assert.match(source, /height: size, width: size/);
    assert.match(source, /fontSize: size \* 0\.38/);
  });
  ```

  And add a new test after it:

  ```ts
  test("avatar exposes a public shape type and re-exports it", () => {
    const source = readSource("../../src/avatar/Avatar.tsx");
    const radiusSource = readSource("../../src/avatar/avatarRadius.ts");
    const indexSource = readSource("../../src/avatar/index.ts");

    assert.match(
      radiusSource,
      /export type AvatarShape = "circle" \| "square"/,
    );
    assert.match(source, /shape\?: AvatarShape/);
    assert.match(indexSource, /export \* from "\.\/avatarRadius"/);
  });
  ```

- [ ] **Step 10 — Run them and watch them fail.**

  Run: `node --import tsx --test tests/unit/avatar.test.ts`
  Expected: FAIL on the `avatarBorderRadius(...)` and `shape?: AvatarShape`
  matches.

- [ ] **Step 11 — Wire the prop into `Avatar.tsx`.** Four edits to
      [`src/avatar/Avatar.tsx`](../src/avatar/Avatar.tsx):
  1. Update the file's leading doc comment (L1) — it says "Circular user avatar":

     ```ts
     /** User avatar that renders initials on a themed disc or rounded square. */
     ```

  2. Add the import beside the existing `./avatarStyles` import (L7):

     ```ts
     import { avatarBorderRadius, type AvatarShape } from "./avatarRadius";
     ```

  3. Add the prop to `AvatarProps`, alphabetically **between `label` and `size`**
     (L21–23):

     ```ts
     /**
      * Disc geometry. `circle` (default) is a full disc; `square` is the same
      * 1:1 box with corners rounded by the theme's `radii.avatarRatio`.
      */
     shape?: AvatarShape;
     ```

  4. Destructure it (again between `label` and `size`, L44–53), compute the
     radius, and use it in the style array (L71–76):

     ```tsx
     export function Avatar({
       accessibilityLabel,
       decorative = false,
       label,
       shape = "circle",
       size = 32,
       style,
       testID,
       textColor,
       tone = "solid",
     }: AvatarProps) {
       const theme = useSharedUiTheme();
       const styles = useMemo(() => createAvatarStyles(theme), [theme]);
       const solid = tone === "solid";
       const borderRadius = avatarBorderRadius(size, shape, theme.radii.avatarRatio);
     ```

     That call lands exactly on Prettier's 80-column limit; run `npm run format`
     and keep whatever it produces (one line or wrapped) — the unit test's regex
     accepts both.

     ```tsx
     style={[
       styles.avatar,
       { borderRadius, height: size, width: size },
       solid ? styles.avatarSolid : styles.avatarSoft,
       style,
     ]}
     ```

     Leave `style` last in the array — that ordering is what keeps
     `style={{ borderRadius: 12 }}` working as a per-instance escape hatch.

  Also update the component's JSDoc block (L37–43) so its "circular radius
  (`size / 2`)" sentence reads:

  ```
   * A circular or rounded-square avatar showing initials. `size` drives the box,
   * the corner radius (`size / 2` for `circle`, `size * radii.avatarRatio` for
   * `square`), and the initials' font size (`size * 0.38`).
  ```

- [ ] **Step 12 — Export the module.** In `src/avatar/index.ts`, add the line
      (keeping the file alphabetical):

  ```ts
  export * from "./Avatar";
  export * from "./avatarRadius";
  export * from "./avatarStyles";
  ```

  No `package.json` change is needed: the `./avatar` subpath already exists and
  is asserted by `tests/unit/packageExports.test.ts` L24.

- [ ] **Step 13 — Run the unit suite and typecheck.**

  Run: `npm run test && npm run typecheck`
  Expected: all tests PASS (including the three touched files) and no TS errors.

- [ ] **Step 14 — Commit.**

  ```bash
  git add src/avatar src/theme.tsx tests/unit/avatarRadius.test.ts \
    tests/unit/avatar.test.ts tests/unit/theme.test.ts
  git commit -m "feat(avatar): add rounded-square shape prop

  Avatar gains shape?: \"circle\" | \"square\", defaulting to circle. The square's
  corner radius is resolved by a new pure avatarRadius module from a new
  radii.avatarRatio theme token (default 0.25), clamped to [0, 0.5], so a
  rounded square looks identical at every size."
  ```

**Outcome:** `<Avatar shape="square" size={48} />` renders a 12px-cornered
rounded square; theme consumers can retune every avatar corner with one token.

### M2 — Story, browser coverage, docs, verify

Makes the new shape visible in Storybook, pins the rendered radius in a browser
test, and brings the contract docs back into alignment.

- [ ] **Step 1 — Add the story.** In
      [`src/stories/avatar.stories.tsx`](../src/stories/avatar.stories.tsx), add
      after `DecorativeBesideLabel` (L37–56):

  ```tsx
  const SHAPE_SIZES = [24, 32, 48, 64];

  export const Shapes: Story = {
    name: "Circle and rounded square",
    render: () => (
      <StorySurface>
        <View style={styles.column}>
          {/* The square corner scales with `size` (radii.avatarRatio, 0.25 by
              default), so the shape reads the same at 24px and at 64px. */}
          <View style={styles.row}>
            {SHAPE_SIZES.map((size) => (
              <Avatar
                accessibilityLabel={`Circle ${size}`}
                key={size}
                label="GS"
                size={size}
              />
            ))}
          </View>
          <View style={styles.row}>
            {SHAPE_SIZES.map((size) => (
              <Avatar
                accessibilityLabel={`Square ${size}`}
                key={size}
                label="GS"
                shape="square"
                size={size}
              />
            ))}
          </View>
          <View style={styles.row}>
            <Avatar
              accessibilityLabel="Payroll Reserve"
              label="PR"
              shape="square"
              size={48}
              tone="soft"
            />
            <Avatar
              accessibilityLabel="Accounts Receivable"
              label="AR"
              shape="square"
              size={48}
              style={styles.amberDisc}
              textColor="#74511f"
              tone="soft"
            />
          </View>
        </View>
      </StorySurface>
    ),
  };
  ```

  The existing `styles.row`, `styles.column`, and `styles.amberDisc` entries
  (L58–75) already cover this; no stylesheet change is needed.

- [ ] **Step 2 — Add the failing browser test.** In
      [`tests/browser/storybook.spec.ts`](../tests/browser/storybook.spec.ts),
      add after the existing avatar test (which starts at L2097):

  ```ts
  test("avatar shape=square rounds corners proportionally to size", async ({
    page,
  }) => {
    await page.goto("/iframe.html?id=avatar-examples--shapes");

    // radii.avatarRatio defaults to 0.25, so a 32px square gets an 8px corner
    // and a 64px square gets 16px — while a circle keeps size / 2. The longhand
    // corner property is asserted because Chromium does not always serialize
    // the `border-radius` shorthand in computed styles.
    await expect(page.locator('[aria-label="Circle 32"]')).toHaveCSS(
      "border-top-left-radius",
      "16px",
    );
    await expect(page.locator('[aria-label="Square 32"]')).toHaveCSS(
      "border-top-left-radius",
      "8px",
    );
    await expect(page.locator('[aria-label="Square 64"]')).toHaveCSS(
      "border-top-left-radius",
      "16px",
    );
  });
  ```

- [ ] **Step 3 — Run the browser test.**

  Run: `npm run test:browser -- storybook.spec.ts -g "shape=square"`
  (add `STORYBOOK_PORT=6007` if port 6006 is taken by another workspace)
  Expected: PASS. If it fails on a `16px` vs `16.0000px` style mismatch, read the
  reported computed value and match it exactly rather than loosening the
  assertion.

  The axe sweep in `tests/browser/a11y.spec.ts` discovers stories from
  Storybook's `/index.json` at run time, so the new story is scanned
  automatically. This change adds no new a11y surface — the avatars are named
  `image` roles exactly as before — so no `axe-baseline.json` entry is expected.
  If the sweep does report a violation on `avatar-examples--shapes`, fix the
  story rather than baselining it.

- [ ] **Step 4 — Update the component README.** In
      [`src/avatar/README.md`](../src/avatar/README.md):
  - Opening paragraph (L3–5): replace "circular user avatar" with
    "user avatar" and note it renders "a themed disc or rounded square".
  - Responsibilities (L9–11): change "Render a circular disc…" to
    "Render a disc or rounded square with one or two initials centered on it."
    and add: "Offer two shapes: `circle` (default) and `square`, whose corner
    radius scales with `size` from the theme's `radii.avatarRatio`."
  - Usage (L26–43): add `<Avatar label="GS" shape="square" size={48} />` to the
    example block and a sentence: "`shape` defaults to `circle`; `square` is the
    same 1:1 box with proportionally rounded corners. Pass
    `style={{ borderRadius }}` for a one-off radius that should not follow the
    theme ratio."
  - Theming (L62–67): add "The `square` shape's corner radius is
    `size * radii.avatarRatio` (default `0.25`, clamped to `[0, 0.5]`)."

- [ ] **Step 5 — Update the protocol contract.** In
      [`docs/protocol/shared-ui-components.md`](../docs/protocol/shared-ui-components.md),
      the Avatar Contract at L276–294 currently mandates a circle. Rewrite the
      intro line and the first two required-behavior bullets, and add one:

  ```markdown
  The avatar family covers the compact initials badge used to represent a person
  or entity, as either a circular disc or a rounded square.

  Required behavior:

  - Render a disc or a rounded square with one or two initials centered on it.
  - Drive the box, the corner radius, and the initials' font size from a single
    `size` prop so every avatar scales proportionally.
  - Offer two shapes: `circle` (the default, radius `size / 2`) and `square`,
    whose radius is `size * radii.avatarRatio` — a theme ratio token (default
    `0.25`) clamped to `[0, 0.5]` so the corner reads identically at every size.
  ```

  Leave the remaining bullets (tones, theme tokens, accessible name, style
  override, `textColor`) as they are. The theme contract earlier in the file
  (L46) names `radii` as a bag without enumerating its keys, so it needs no edit.

- [ ] **Step 6 — Update the top-level README.** In
      [`README.md`](../README.md) L41, change
      "`@firna/ui/avatar` for the themed circular initials avatar." to
      "`@firna/ui/avatar` for the themed initials avatar (circle or rounded
      square)."

- [ ] **Step 7 — Update the plan index.** This plan is already listed under
      **Active** in [`plans/README.md`](README.md). Move that line to the
      **Completed** section and rewrite its trailing summary to state what
      shipped and that `npm run verify` is green, matching the style of the other
      completed entries.

- [ ] **Step 8 — Run the full gate.**

  Run: `npm run verify`
  Expected: green across format:check, unit tests, typecheck, build,
  package smoke, Storybook build, and the browser suite including the axe
  WCAG 2.1 A/AA sweep. If `format:check` fails, run `npm run format` and re-run.

- [ ] **Step 9 — Commit and push.**

  ```bash
  git add -A
  git commit -m "docs(avatar): document the rounded-square shape

  Adds the Shapes story, a browser assertion pinning the proportional corner
  radius, and brings the component README, the protocol Avatar Contract, and the
  top-level README back in line with the new shape prop."
  git push
  ```

- [ ] **Step 10 — Run the AI review.**

  Run: `cargo xtask review`
  Report each finding with a number, a severity, and a recommendation rather than
  fixing them automatically — the user decides what to address.

**Outcome:** the rounded square is visible in Storybook, its radius is pinned by
a browser test, and the contract docs no longer mandate a circle.

---

## Follow-up (not in scope)

- If a consumer surface wants square avatars everywhere, that is a theme decision
  (`radii.avatarRatio`) plus per-call-site `shape="square"` — there is
  deliberately no global "default shape" theme token until a second consumer asks
  for one.
- Kanban and List avatar slots could gain a shape pass-through later; today they
  accept an `Avatar` node directly, so a consumer can already pass
  `shape="square"` themselves.
