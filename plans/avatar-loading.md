# Avatar loading state

Give [`Avatar`](../src/avatar/Avatar.tsx) a `loading` prop that replaces the
initials with the loader family's `dot-grid` shape while the person or entity
behind the disc is still being fetched.

**Status:** M1 and M2 delivered. `Avatar` ships `loading?: boolean` (default
`false`). The dot grid is the library's existing
[`DotGridLoader`](../src/loader/DotGridLoader.tsx) sized at half the avatar box
by the new pure `avatarLoader` module, drawn in the foreground color resolved by
the new `avatarForegroundColor` helper so the dots and the initials they replace
can never disagree. A loading disc reports `progressbar` + busy semantics under
its existing accessible name. Unit tests (`avatarLoader.test.ts` + an extended
`avatar` suite), a `Loading` story, and a browser assertion pinning the role,
the dot count, the dot color, and the unchanged footprint all landed.

---

## Background — what already existed

The library already owns a nine-dot 3×3 grid with a diagonal brightness wave:
[`DotGridLoader`](../src/loader/DotGridLoader.tsx), one of the six
[`Loader`](../src/loader/Loader.tsx) variants. It runs off a single
`Animated.loop`, stops on unmount, animates only opacity and transform, and
drops to a brightness-only animation under "reduce motion". So this feature is
about wiring that shape into the disc, not about building an animation.

Two things had to be decided rather than copied:

1. **What color are the dots?** The initials' color is resolved across three
   style-array entries (`avatarText` → `avatarTextSolid` → a `textColor`
   override). The loader needs that as a _value_, not a style, and it must not
   re-derive the rule — a palette disc that overrode `textColor` to clear the
   4.5:1 floor would otherwise get white dots on a cream background.
2. **What does it announce?** The disc is exposed as
   `accessibilityRole="image"` named by `accessibilityLabel ?? label`. A disc
   showing nine animated dots is not an image of anyone.

## M1 — the dot grid on the disc

- [x] Add `loading?: boolean` (default `false`) to `AvatarProps`.
- [x] Extract `avatarForegroundColor(theme, solid, override)` into
      `avatarStyles.ts` and build `avatarText` / `avatarTextSolid` from it, so
      the tone/override precedence lives in exactly one place. Nothing was
      removed from the exported `AvatarStyles` type.
- [x] Add the pure `avatarLoader.ts` sibling module —
      `AVATAR_LOADER_RATIO = 0.5` and `avatarLoaderSize(size)` — mirroring how
      `avatarRadius.ts` keeps the corner math renderer-free. Half the diameter
      fits inside a circle's inscribed square (`size / √2`), so one ratio serves
      both shapes; the box is rounded to whole pixels and floored at 6, below
      which `dotGridGeometry`'s whole-pixel gaps overflow their own box.
- [x] Render `<DotGridLoader>` in place of the initials `Text`, at
      `LOADER_DURATIONS["dot-grid"]`, inside an `aria-hidden` wrapper.
- [x] Widen `LoaderShapeProps["color"]` from `string` to `ColorValue`. Every
      shape feeds it straight into a `backgroundColor` / `borderColor`, so this
      is the type those props already accept, and it lets `Avatar` forward a
      `textColor` override without a cast.

## M2 — semantics, docs, and tests

- [x] Swap the container to `accessibilityRole="progressbar"` +
      `accessibilityState={{ busy: true }}` / `aria-busy` while loading and
      exposed, keeping the same accessible name; revert to `image` otherwise.
      A `decorative` avatar stays fully hidden rather than announcing busy.
- [x] `Loading` story covering the size scale, both tones, `square`, a
      `textColor` palette disc, and a loading/settled pair side by side.
- [x] `avatarLoader.test.ts` pins the ratio, the whole-pixel rounding, the
      small-avatar floor, and — against the real `dotGridGeometry` — that the
      grid clears the circle's inscribed square at every size.
- [x] Browser test asserts the busy `progressbar` role, the absent initials,
      nine dots, the solid and `textColor` dot colors, and an unchanged
      footprint between the loading and settled discs.
- [x] `src/avatar/README.md` and the Avatar contract in
      `docs/protocol/shared-ui-components.md` updated.

## Deferred

- **A skeleton-style shimmer alternative.** `Skeleton` already covers
  content-shaped placeholders; a second loading look on `Avatar` would need a
  reason beyond taste.
- **Fading between the dots and the initials.** The swap is instant today. A
  cross-fade would need a reduced-motion path of its own and has no call site
  asking for it yet.
