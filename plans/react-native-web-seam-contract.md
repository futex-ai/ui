# React Native Web seam contract

Status: Active. On branch `calummoore/firna-rnw-seam-contract-mhsd`, no pull
request yet. The pull request that completes the work deletes this plan, as the
`plans` skill says.

## Summary

`@firna/ui` reaches the platform only through the seam modules in
`src/primitives`. Each seam has a native file and a `.web` file. Today every
`.web` file draws through the library's own DOM backend in
`src/primitives/dom/`. Some consumers draw Firna with `react-native-web` (RNW)
instead. Bookfolio, the Expo web app in `futex-ai/accounting`, is one of them.
Its Metro resolver sends three seams to their native files on web, and its
tests keep three more copies of that seam list.

The update from 4.0.0 to 5.1.0 showed these problems on the RNW route:

- The `link` seam imports the `./dom` barrel, so every RNW page that renders a
  `List` loads all 59 DOM-backend files. That is about 80 KB minified, or 28 KB
  gzip, of a second renderer that never draws.
- The native `link.tsx` renders a `div` with the link role and no `href`.
  Enter does nothing, and a Ctrl or Meta click runs the app action. So a
  consumer cannot route `link` to the native file, because
  `docs/protocol/app-shell-parts.md` requires a real anchor on web.
- Drag-select and the web theme root import DOM-backend modules directly,
  outside any seam.
- The DOM backend's responder port uses the same global flag and node key as
  RNW's responder system. On a page that loads both, one system can disable the
  other.
- `link/NewTabIndicator` draws the Lucide `ArrowUpRight` icon. A consumer that
  curates its Lucide icons has no way to find the icons that Firna draws.

The change gives every seam a form that is correct on RNW. It publishes one
rule that a consumer applies in Metro, Node, and esbuild to route every seam
to that form, so that the consumer keeps no seam list. The DOM backend stays
the default for every consumer that does not apply the rule, such as Juno. The
change does not edit Bookfolio. Bookfolio adopts the release later.

Research reports: `.context/react-native-web-seam-contract/brainstorm-report.md`,
`rnw-audit-report.md`, and `options-check.md`.

### User decisions

- **Option G, Cal, 2026-11-26.** Firna supports RNW consumers by contract. Each
  seam gets a form that is correct on RNW, and the app sends every seam to that
  form through one rule. This reverses decision 1 of the completed plan of
  pull request #168, `plans/pure-react-dom-backend.md`: "The DOM backend
  replaces `react-native-web` for every web resolution, including Expo web
  through Metro. One `.web` file per seam module, no third export condition."
  The task message gives the reason: Bookfolio draws its own screens with RNW,
  and the update to 5.1.0 made it load a second renderer and lose the anchor
  of its list link rows.
- **Cal, 2026-11-27, answered the four decisions below:** 1A, 2D, 3A, and 4C.
  For decision 3, Cal asked for a new workspace for the fix after this change
  merges.

### Terms

- **Node tree:** `dist/node/**`, which the `import` and `types` conditions
  resolve. Its relative specifiers name explicit `.js` files, and a `.web.js`
  file where a `.web` sibling exists.
- **Native tree:** `dist/**` outside `dist/node`, which the `react-native`
  condition resolves. Its specifiers have no extension, and Metro picks the
  platform file.
- **RNW form:** the file that an RNW app must load for a seam.
- **Responder:** RNW's global gesture lock. RNW's `Pressable`, `ScrollView`,
  and `PanResponder` use it.
- **Press registry:** the map of active presses in
  `src/primitives/webPress/usePress.ts`. `endPointerPresses` ends the presses
  in it.

### Decisions

Cal answered decisions 1 to 4 below on 2026-11-27. Decision 5 came from
Milestone 6, and Cal answered it on 2026-11-27 too. An options check ran
over them on 2026-11-27, and its results are merged here. Each item keeps its
record. Its **Answer** line gives the choice.

#### 1. The shape of the published rule

- **Severity:** High. **Effort:** Medium.
- **Source:** Design.
- **Category:** Code structure.
- **Location:** None. The rule is new.
- **Background:** Expo web Metro and Bookfolio's esbuild harness resolve the
  node tree through the `import` condition. Bookfolio's Node hooks resolve the
  native tree. A bare React Native Metro app asserts `react-native` on every
  platform, so on web it resolves the native tree too. Bookfolio's resolver
  matches a seam request from inside Firna's `dist` and returns the native file
  of that seam.
- **Problem:** No published rule exists. Each consumer writes its own matcher
  and its own seam list, and the list goes stale when Firna adds a seam.
- **Impact if no action:** Bookfolio keeps four copies of the seam list. A new
  seam, such as `link` in 5.1.0, silently loads the DOM backend again.
- **Root question:** How does an RNW app make Metro, Node, and esbuild load
  Firna's RNW forms, with no seam list of its own, also after Firna adds a
  seam?
- **Options:**
  - **A.** A subpath, `@firna/ui/rnw`, exports one pure function:
    `resolveFirnaRnwFile(fromFile, request)`. It returns the absolute path of
    the RNW form when `fromFile` is inside Firna's `dist` and `request` names a
    seam whose RNW form is not its `.web` file. Otherwise it returns `null`.
    The build generates its seam table from the source. A consumer writes about
    five lines in each tool. Effort: Medium.
  - **B.** Option A, plus three ready adapters in the same module: a Metro
    `resolveRequest` wrapper that chains the app's own resolver, an esbuild
    plugin, and a Node `resolve` hook. A consumer writes one line in each tool.
    Firna owns glue for tools whose versions it does not pin, and unit tests
    must fake each tool's resolver context. Effort: Medium.
  - **C.** A custom export condition, for example `firna-react-native-web`,
    that points every subpath at a third build tree, `dist/rnw/**`, where the
    seams already name their RNW forms. A consumer sets one condition name in
    each tool and writes no resolver code. The package grows by about 2.1 MB of
    JavaScript, the release contract changes, and Bookfolio's Node hooks must
    move to conditions. Effort: Large.
  - **E.** A custom condition points every subpath at the native tree, as
    `react-native` does. A seam whose RNW form is its own file gets a
    `<seam>.rnw.js` file there. The app adds the condition and puts `.rnw.js`
    first in the web extension order of Metro and esbuild, so these tools need
    no resolver code. Node still needs a hook, because Node does not resolve
    extensionless specifiers. The extension order applies to every package, and
    the release contract gains a condition. Effort: Medium.
  - **F.** A condition inside the seams. Each `.web` seam file imports its
    backend through a private `imports` entry of `package.json`, for example
    `#firna/react-native`. The entry maps a custom condition to the RNW form and
    `default` to the DOM form. The app adds one condition name in each tool and
    writes no resolver code. There is no third tree, and Bookfolio's current
    resolver keeps working. Firna's own tools must resolve the `#` specifiers:
    both type-check passes, the `tsx` unit tests, Storybook, and the Mokly
    catalogue. The declarations must stay free of `#` specifiers. Metro 0.84
    resolves `imports` with conditions. Metro 0.83 is not checked. Effort:
    Large.
- **Left out:**
  - Change nothing: Bookfolio keeps its four copies, so it fails the goal.
  - Publish only the seam table: each app still writes its own matcher, so it
    fails the goal.
  - Choose the backend at run time: both renderers stay in the bundle, so it
    fails the goal.
  - A separate npm package: it breaks the release contract, which names one
    package.
  - A file map in a custom `package.json` field for Metro's
    `resolverMainFields`: esbuild and Node apply no such map, so it fails the
    goal.
  - A first draft listed package `imports` for every seam import, as option
    D. Option F is better on each of its costs: it changes the seam files only,
    not 268 source files, it keeps Bookfolio's resolver working, and it is not
    a major release.
- **Wider fix:** F. It makes the routing a property of the package, as C does,
  without the third tree.
- **Previous examples:** Bookfolio's
  `ts/app/scripts/metro-firna-resolver.cjs` and its copies in
  `webPlatformResolution.test.ts`, `metroWebBundle.ts`, and
  `support/webPlatformResolution.mjs`.
- **Recommendation:** A. It is the smallest public surface that removes every
  copy of the list, its generated table cannot go stale, and it keeps the
  export conditions that the release contract names. F protects consumers best
  when no app code matters more than a Large effort.
- **Answer:** A, Cal, 2026-11-27.

#### 2. How a drag ends a press on RNW

- **Severity:** Medium. **Likelihood:** Common. **Effort:** Medium.
- **Source:** Design.
- **Category:** Product bug.
- **Location:** `src/drag-select/dragSelectableSessionDom.ts:4`,
  `docs/protocol/drag-select.md:145-148`.
- **Background:** A drag-select drag can start on a button. The protocol says
  that the start ends the library `Pressable` press of the same pointer: the
  control loses its pressed look, and its `onPressOut` receives the pointer
  event that started the drag. On the DOM backend, drag-select calls
  `endPointerPresses`, which ends each press in the press registry. On RNW, a
  `Pressable` press lives in RNW's responder, so that call does not reach it. A
  link press stays in the press registry on both renderers, because the link
  host keeps Firna's press hooks.
- **Problem:** On RNW the button keeps its pressed look until release, or until
  a container above it scrolls. `onPressOut` fires late, and `onLongPress` can
  fire, because RNW cancels a long press only past 10 px and a drag on a
  control starts at 4 px. RNW ends a press only when the press loses the
  responder, and it then passes its own responder event. So no RNW form can
  pass the exact event object that the protocol names.
- **Impact if no action:** RNW apps show a stuck pressed button during a drag
  and can run a long-press action. The import also loads DOM-backend code.
- **Root question:** How does a drag that starts on a library control end that
  control's press on every web renderer, whichever press system holds it?
- **Options:**
  - **A.** Do nothing on RNW. The protocol records the gap for the RNW route.
    Effort: Small.
  - **B.** An RNW form of the takeover claims RNW's responder for the provider
    host when the drag starts, through `onMoveShouldSetResponderCapture`. RNW
    then ends the press, and `onPressOut` receives RNW's responder event for
    the mouse move. A move whose target is already outside the provider host
    makes no claim. A link press in the press registry stays pressed. Effort:
    Medium.
  - **C.** An RNW form dispatches a synthetic `dragstart` on the pressed
    element, which RNW's responder treats as a cancel. It depends on an
    internal event table of RNW 0.21 and can start other `dragstart` handlers.
    Effort: Medium.
  - **D.** One takeover for both web renderers. When the drag starts, the
    `.web` takeover calls `endPointerPresses`, as today, which ends the presses
    in the press registry, such as a link row. The provider host also claims
    the responder, which ends an RNW `Pressable` press. On the DOM backend the
    claim goes through the DOM responder port, where no library press holds
    the responder. The rule routes no takeover form. The protocol's event
    sentence changes for RNW, as in B. The claim also ends a responder gesture
    of the same press on both renderers, so the drag-select browser specs must
    show no other change. Effort: Medium.
  - **E.** The RNW form of `reactNative` draws the library `Pressable` with
    Firna's press hooks over RNW's `View`, as the link host does. Then
    `endPointerPresses` ends every library press with the exact event, and the
    protocol does not change. The seam stops being a plain re-export of RNW.
    Library presses then do not join RNW's responder, so an RNW `ScrollView`
    cannot cancel them, and an enclosing app `Pressable` also presses. Effort:
    Large.
- **Left out:** A deep import of RNW's `terminateResponder`: it is not public
  API, it passes an empty event, and a deep path can load a second copy of
  RNW's responder module.
- **Wider fix:** D. One takeover ends both press systems on both renderers.
- **Previous examples:** `src/panel-resize/usePanelResizeDrag.ts:84-87` stops
  `pointerdown` so that an enclosing press does not start. An RNW `Pressable`
  starts from the document `mousedown`, so it still presses.
- **Recommendation:** D. It ends both kinds of library press on both renderers
  with public API, and only the identity of the event changes on RNW. The
  first draft recommended B, which leaves a link row pressed on RNW.
- **Answer:** D, Cal, 2026-11-27.

#### 3. Focus glow hides resting shadows on RNW

- **Severity:** Medium. **Likelihood:** Common. **Effort:** Medium.
- **Source:** Design.
- **Category:** Product bug.
- **Location:** `src/primitives/dom/View.tsx:44-50`,
  `src/primitives/dom/css.ts:180-182`, `src/dropdown/dropdownSelectorStyles.ts`,
  `src/workflow/workflowStyles.ts`.
- **Background:** `docs/protocol/shared-ui-theming.md` requires that on web a
  library control keeps both its resting shadow and its focus glow. Both use
  `box-shadow`. The glow is a stylesheet rule on the focus data attributes. The
  DOM backend's `View` moves a resting shadow into the
  `--firna-focus-ring-base-shadow` variable, and the rule draws the glow over
  it. RNW compiles a `StyleSheet.create` shadow into a class and writes other
  shadows inline.
- **Problem:** On RNW, the glow rule outranks a class shadow, so focus drops
  the resting shadow. Examples are the invalid halo of `DropdownSelector` and
  the selected ring of `WorkflowNode`. An inline shadow outranks the rule, so
  focus shows no glow. At rest the class shadow ties with Firna's rest rule,
  so it shows only while Firna's stylesheet comes before RNW's.
- **Impact if no action:** RNW apps lose the validation and selection rings
  under focus, and can lose them at rest when the stylesheet order changes.
  The requirement in force is not met on the RNW route.
- **Root question:** How does a focus host keep its resting shadow under the
  glow on every web renderer?
- **Options:**
  - **A.** Fix it after the merge. The protocol records the gap for the RNW
    route, and a follow-up item holds the fix. Effort: Small.
  - **B.** Move the rewrite into the shared focus-ring code. Each focus host
    with a resting shadow gives that shadow to the focus-ring helper, which
    writes it into the variable on every web renderer, as raw DOM hosts must
    already do. The helper does not see a host's style, so each such host
    changes. The `focus-ring` browser specs cover the DOM path. Effort: Medium.
  - **C.** The RNW form of `reactNative` wraps RNW's `View`, `Pressable`, and
    `TextInput`, and moves the shadow of a marked host into the variable, as
    the DOM `View` does. Only marked hosts flatten their style. No host
    changes, and the DOM path does not change. The seam stops being a plain
    re-export of RNW. Effort: Medium.
  - **D.** Draw the glow with `outline` in place of `box-shadow`, with a
    negative offset for an inset host. A resting shadow then never meets the
    glow on any renderer, and no host must move its shadow. It changes the
    sentence on raw DOM hosts in the theming protocol and
    `docs/focus-indicators.md`. Up to 49 lines in 11 browser test files read
    `box-shadow`, and focused baselines can change. Safari before 16.4 draws
    square outline corners. Effort: Large.
- **Left out:**
  - A more specific glow rule: one rule cannot add to a `box-shadow` that
    another rule sets, so the glow still replaces the shadow.
  - A ring drawn by a pseudo-element: a host with `overflow: hidden` clips the
    ring of its child, so it fails the goal.
  - Each host draws its resting ring with `outline`: an outline cannot draw an
    elevation shadow, so it fails the goal.
- **Wider fix:** D. It removes the conflict, so no host has to move its shadow.
- **Previous examples:** the rule for raw DOM hosts in
  `docs/protocol/shared-ui-theming.md` and `src/focusRing.ts:185-188`.
- **Recommendation:** B. It meets the requirement on both renderers and does
  not depend on stylesheet order. C is the choice when no host may change. D
  best protects the codebase.
- **Answer:** A, Cal, 2026-11-27. The fix waits until after the merge, in a
  new workspace. The protocol records the gap for the RNW route, and the
  follow-up item holds options B, C, and D.

#### 4. How a consumer's icon curation keeps Firna's icons

- **Severity:** Medium. **Likelihood:** Common. **Effort:** Medium.
- **Source:** Design.
- **Category:** Docs or spec.
- **Location:** `src/primitives/icons.ts:12-106`,
  `src/link/NewTabIndicator.tsx:50`.
- **Background:** The icon seam re-exports 93 Lucide icons from each package
  root. Bookfolio aliases both Lucide package roots to a curated module of 13
  icons, to keep its bundle small. Metro leaves a missing name `undefined`.
  Firna keeps a hand list of the 93 names in `scripts/package-smoke-icons.mjs`.
- **Problem:** No published list says which icons a Firna subpath draws. A
  Metro consumer finds a missing icon only at run time. A `List` with a
  new-tab link throws, because `ArrowUpRight` is missing.
- **Impact if no action:** A curating consumer ships a crash or a missing icon
  with no build error after each Firna update.
- **Root question:** How does an app that limits the Lucide icons in its
  bundle still render every icon that Firna draws, also after a Firna update?
- **Options:**
  - **A.** Change nothing. The consumer scans Firna's `dist` itself. Effort:
    Small.
  - **B.** Publish one flat list of the 93 icon names of the seam, in the same
    module as the rule. A consumer that uses one Firna subpath still curates
    all 93. Effort: Small.
  - **C.** Publish the icon names for each public subpath, generated at build
    time from the import graphs of both trees, so that native-only icons are
    in the native list. The hand list in `scripts/package-smoke-icons.mjs`
    then comes from the same output. Effort: Medium.
  - **D.** The icon seam draws nothing for a missing icon and warns once
    through `devWarn`. It hides a real gap in production. Effort: Medium.
  - **E.** The web icon seam imports each icon from its own `lucide-react`
    module, for example `lucide-react/dist/esm/icons/arrow-up-right.js`, and
    the RNW form of `icons` becomes `web`. An alias of the package root then no
    longer reaches Firna's icons on web. `lucide-react` 0.562.0 has no
    `exports` map, so these paths are not public API, and a later release can
    break them. Native curation still needs a list. Effort: Medium.
  - **F.** Firna owns its glyphs. The build generates one module for each
    glyph from Lucide's icon data, drawn through the `svg` seam. No alias of a
    Lucide package can then remove a Firna icon on any platform. It changes the
    package boundary in `docs/protocol/shared-ui-components.md` and the Lucide
    peers, and 51 files change their icon imports. Effort: Large.
- **Left out:** Deep per-icon imports from `lucide-react-native`: the package
  exports only `.` and `./icons`, so Node and esbuild reject the deep paths.
- **Wider fix:** F, because it puts Firna's icons outside the app's curation.
- **Previous examples:** `scripts/package-smoke-icons.mjs`, and Bookfolio's
  `ts/app/src/__tests__/lucideBundleImports.test.ts`, whose scan misses
  `ArrowUpRight` for `list`.
- **Recommendation:** C. A consumer curates exactly what its subpaths draw, and
  the list cannot go stale. F best protects the apps.
- **Answer:** C, Cal, 2026-11-27.

#### 5. A drag whose starting move lands outside the provider

- **Severity:** Medium. **Likelihood:** Rare. **Effort:** Medium.
- **Source:** Implementation.
- **Category:** Product bug.
- **Location:** `src/drag-select/dragSelectableSessionDom.ts`,
  `src/primitives/dom/responder/negotiation.ts:160-174`,
  `docs/protocol/drag-select.md` "Press takeover",
  `tests/browser/rnw-drag-select.spec.ts:114-123`.
- **Background:** Milestone 6 built decision 2D. When a drag starts, the
  provider ends the presses in Firna's press registry, and its host claims the
  responder on the `mousemove` that follows the starting `pointermove`. On RNW
  that claim ends the press of a library `Pressable`. Both responder systems,
  RNW's and the DOM backend's port, ask only the common ancestors of the move
  target and the current responder whether they claim.
- **Problem:** When the move that starts the drag already lands outside the
  provider, neither responder system asks the provider. On RNW, the button
  keeps its pressed look until release, and `onPressOut` runs only on release.
  On both renderers, an app's `PanResponder` of the same press keeps running
  until release. The drag still selects. The protocol says that the start ends
  the press. The options check of decision 2 noted this gap, but option D's
  text did not state it.
- **Impact if no action:** a drag that starts near the provider's edge leaves
  the control pressed on RNW and an app gesture running on both renderers.
  `onLongPress` can run only when the drag starts closer than 10 px from the
  press point: RNW cancels the long-press timer past 10 px, and a drag on a
  control starts at 10 px by default. So the long-press risk is mainly a
  `Pressable` that is its own drag target, which starts at 4 px. The RNW case in
  `tests/browser/rnw-drag-select.spec.ts` stays `test.fixme`.
- **Root question:** How does a drag whose starting move lands outside the
  provider end the press and the gesture of that pointer, on both web
  renderers?
- **Options:**
  - **A.** Record the gap. The protocol says that on both renderers, when the
    starting move lands outside the provider, the responder press and gesture
    end at release. The `test.fixme` case is removed, because a test of the
    gap would only pin RNW's own press behaviour. A follow-up item holds
    option D. Effort: Small.
  - **B.** When the starting move lands outside the provider, the provider
    calls `setPointerCapture` on its host for that pointer and claims the
    responder on the next `mousemove`. A probe showed that the RNW press then
    ends one move after the start, and `onPressOut` gets that later move, so
    the protocol's event sentence changes. The capture clears the hover of the
    element under the pointer and sends the release click to the provider,
    where the provider already swallows it. Hit tests, auto-scroll, and
    scrollbar presses did not change. The capture must be released whenever a
    session ends: in the probe it outlived a synthetic `pointercancel`, and the
    next click then went to the provider. A pointer that stops dead after the
    start gives no next move. Effort: Medium.
  - **C.** On the RNW route, draw the library `Pressable` with Firna's own press
    hooks, as decision 2 option E. Then `endPointerPresses` ends every library
    press on the starting move. It reverses the protocol's decision that a
    `Pressable` keeps RNW's press handling, so RNW scroll views cannot cancel a
    library press. The RNW form of `reactNative` stops being a plain re-export
    and must import the shared press module, which breaks the design call that
    a native RNW form imports only packages. It does not end an app's
    `PanResponder`. Effort: Large.
  - **D.** When the starting move lands outside the provider, the provider
    dispatches one copy of that `mousemove`, with the same coordinates and
    buttons, on its own host. Both responder systems then ask the provider, and
    the claim runs on the starting move. A probe on both renderers showed that
    the press ends on the starting move with no long press, an app
    `PanResponder` gets its termination request, hover stays, and a plain click
    still runs `onPress`. The protocol does not change, and the `test.fixme`
    case can pass as written. An app's `mousemove` listeners see one extra,
    untrusted event for each such drag. Effort: Medium.
- **Left out:**
  - Pointer capture when the press arms: the probe showed that it sends
    ordinary button clicks to the provider, so a button no longer activates.
  - A deep import of RNW's `terminateResponder`: it is not public API, as
    decision 2 says.
  - Synthetic cancel events such as `dragstart`, `select`, or `blur`, and a
    synthetic `scroll`: each depends on internals of RNW's event tables, or has
    side effects for the app, and D is better on every point.
  - A claim at press start, a claim from the theme root, an overlay hit area,
    and holding the start until the pointer is back inside: the options check
    gives the reason for each in
    `.context/react-native-web-seam-contract/options-check-5.md`.
- **Wider fix:** D. It meets the protocol on both renderers, for library
  presses and app gestures alike.
- **Previous examples:** the options check of decision 2, in
  `.context/react-native-web-seam-contract/options-check.md`, item 2. Note:
  decision 2's text says that a drag on a control starts at 4 px. The default
  is 10 px, at `src/drag-select/dragSelectableOptions.ts:14`.
- **Recommendation:** D. It is the only option that meets the protocol as
  written, on the starting move, on both renderers. The first draft
  recommended A, and the options check of 2026-11-27 changed it.
- **Answer:** D, Cal, 2026-11-27.

### Design calls

These calls are mine, made on 2026-11-27, and they follow the answers above.

- **The link host serves both web renderers.** `link.web.tsx` builds the link
  on the seam's own `View` with `href`, `hrefAttrs`, `aria-current`,
  `dataSet`, and `onClick`. The press and hover hooks move out of `dom/` to a
  shared web module. Both renderers turn a `View` with an `href` into a real
  anchor and forward those props, so the `.web` link is the RNW form, and the
  rule does not route `link`. RNW's `Pressable` is not used, because it stops
  every click and runs `onPress` on a Ctrl or Meta click. Reason: one host
  keeps one behaviour on both renderers. Condition: the pressed-look timing
  stays the same, as `tests/browser/link.spec.ts` pins. A change there goes to
  Cal. Known caveat: on RNW, an enclosing RNW `Pressable` ignores the claim
  mark of the press hooks, so it also shows its pressed look. A follow-up item
  records it.
- **A seam table in the source.** `src/primitives/rnwForms.ts` names the RNW
  form of each seam: `native` for the native file, or `web` for the `.web`
  file. A unit test fails when a seam pair has no entry, so a new seam cannot
  skip the contract. The build generates the rule's table from it. A third
  kind, a file of its own, is added only when a later seam needs it. Reason: one source of truth that the gate checks.
- **The RNW form of each seam.** `reactNative`, `svg`, and `icons`: `native`.
  They are correct on RNW today. `link`: `web`, as above. `domBackendCss`:
  `web`, because RNW needs the focus-ring rules of the stylesheet.
- **Where the RNW forms live.** The rule returns files of the native tree,
  `dist/primitives/<seam>.js`. Each native RNW form imports only packages,
  never a relative module, so that a request from either tree loads one copy
  of each module. A unit test checks the emitted JavaScript. Shared web state,
  such as the press registry, stays in `.web` modules, which both renderers
  load from the same tree. Reason: Bookfolio's shape, with no third tree.
- **Direct DOM imports leave `dom/`.** The library stylesheet and the
  hide-scrollbar attribute move out of `dom/` into a shared web module that
  both renderers use. `themeRoot.web.tsx` and `dragSelectableScrollbar.ts`
  import them from there. Drag-select imports `endPointerPresses` from the
  shared press module that the link host uses. Reason: no module outside
  `src/primitives` reaches the DOM backend.
- **The RNW route loads no DOM-backend module.** The protocol states it as a
  requirement of the route. A test bundles every public subpath through the
  rule and finds no file under `primitives/dom/`. Reason: this is the purpose
  of the change, and the test is the regression test of the requirement.
- **The DOM backend's responder uses its own globals**, not RNW's
  `__reactResponderSystemActive` and `__reactResponderId`. Reason: a page that
  loads both systems must not let one disable the other.
- **`react-native-web` is not a peer.** The protocol names the supported range,
  `>=0.21.3 <0.22`. RNW becomes a devDependency for the tests, and `esbuild`
  becomes an explicit devDependency. Reason: npm 7 and later reject an
  installed optional peer outside its range, so a peer entry could break the
  install of an app with another RNW version in a minor release.
  Correction, my call, 2026-11-27: the minimum was `0.21.2` until the
  follow-up sweep found that RNW 0.21.2 does not export `InputAccessoryView`,
  which the native `reactNative` seam re-exports. esbuild and Node reject the
  missing name, and Metro leaves it `undefined`. RNW 0.21.3 exports it, and
  the release is not published yet.
- **The RNW test harness.** A browser spec bundles a harness with esbuild,
  RNW, and the published rule, and renders it with `page.setContent`. It does
  not use Storybook. Reason: it proves the rule as a consumer applies it.
- **The stylesheet reaches every focus host on the RNW route.** On RNW, the
  `View`, `Text`, and `TextInput` primitives come from RNW and inject no Firna
  stylesheet, so today only `SharedUiThemeProvider` injects it. `useFocusRing`
  injects the library stylesheet on web through a web-only module, as the DOM
  `View` does. Reason: the glow must not depend on the provider on one route
  only, and the app gets no new requirement.
- **The protocol states the responder claim on both renderers.** Decision 2D
  claims the responder on both renderers, so the start also ends a responder
  gesture of the same press, such as an app's `PanResponder`. Reason: a review
  must be able to check that behaviour.
- **Review finding 2 of round 1, answered by Cal on 2026-11-27: D with C.**
  The RNW form of `svg` and `icons` becomes `web`, so the RNW route draws SVG
  with the DOM `<svg>` shim and icons with `lucide-react`, and only
  `reactNative` routes to its native file. The alias and the rule are then
  the whole app setup in Metro, esbuild, and Node. The gate runs that
  documented setup: the harness uses only the README's esbuild settings, the
  dist test resolves the real peers, and a `test:dist` case imports every
  public subpath through the documented Node hook. This replaces the earlier
  design call that gave `svg` and `icons` their native forms.
- **A text-field seam and a shared web ref helper, my call, 2026-11-28, from
  review round 2.** `src/primitives/textField` wraps the seam `TextInput` on
  both web renderers. It owns Enter with the DOM backend's existing rule, now
  in `src/primitives/textFieldEnter.ts`, and it passes a forwarded `onKeyDown`
  through on RNW. `src/primitives/refs/useForwardedHostRef.ts` fills
  `setNativeProps`, and `setSelection` for a text field, on the five public
  refs when the renderer does not install them. Its RNW form is `web`.
  Reason: review findings 7 and 9 showed that RNW drops `submitBehavior` and
  these ref methods, and the fix keeps the RNW form of `reactNative` a plain
  re-export.
- **Review round 2, answered by Cal on 2026-11-28.** Finding 8: option A.
  The provider sends the copy of the starting `mousemove` at every drag
  start, during the document's capture phase, so content that stops the
  move below the provider cannot keep the press. A stop above the provider
  still keeps it, and the drag-select protocol states that limit. Finding 7,
  option E: the Input contract states React Native's Enter rule, where
  `submitBehavior` overrides `blurOnSubmit` and a single-line `newline` acts
  as `blurAndSubmit`, and the shared web rule follows it on both renderers.
- **Other RNW fixes in scope.** The toast live region sets `aria-atomic` on
  the element, because RNW drops the prop. The comments in four drag hooks that
  say RNW's `Pressable` stops `pointerdown` are corrected. Reason: the contract
  says that Firna is correct on RNW, and each fix is Small.
- **Release type: minor.** The commits use `feat`, so release-please makes
  5.3.0 after the 5.2.0 release on `origin/main`.
  No export target changes, `dom/` is not public, and a consumer that
  does not apply the rule gets the DOM backend as before. Bookfolio's current
  resolver keeps working, because `reactNative`, `svg`, and `icons` keep their
  native forms. Reason: the repository marks only a breaking change with `!`.
- **Docs.** The protocol docs state the RNW route, and the follow-up item
  `plans/follow-ups/docs-name-react-native-web.md` changes, because some RNW
  names are now correct names of a supported route. `README.md:180-186` says
  that Expo web resolves the `react-native` condition. Expo web resolves the
  `import` condition and the node tree, and a bare React Native Metro app
  resolves the native tree. The docs milestone corrects it.

### Approaches left out

- Keep the DOM `Link` on RNW: it loads the whole DOM backend and races RNW's
  responder system.
- Route `link` to the native file: it renders no anchor.
- RNW `Pressable` with an `href` as the link: it stops every click and runs the
  app action on a Ctrl or Meta click.
- RNW `Text` with an `href`: it uses inline text layout, which breaks the box
  of a link row.

Contract owners:

- [Shared UI package protocol](../docs/protocol/shared-ui-package.md): the
  RNW route and the rule.
- [Shared UI component protocol](../docs/protocol/shared-ui-components.md):
  the package boundary.
- [Shared UI theming protocol](../docs/protocol/shared-ui-theming.md): the
  resting shadow under the glow.
- [App shell parts protocol](../docs/protocol/app-shell-parts.md#links): the
  link requirements, unchanged.
- [Drag-select protocol](../docs/protocol/drag-select.md): the press takeover.
- The [primitives README](../src/primitives/README.md).

Replaced ways:

- `link.web.tsx` over `dom/Link.tsx` → the link host over the seam `View`.
  Consumers: `link.web.tsx`, `tests/unit/link.test.ts`. Moved in Milestone 3.
  `dom/Link.tsx` is deleted in Milestone 3.
- Imports of `primitives/dom/*` outside `src/primitives` → the shared web
  modules. Consumers: `src/themeRoot.web.tsx`,
  `src/drag-select/dragSelectableScrollbar.ts`, and
  `src/drag-select/dragSelectableSessionDom.ts`. Moved in Milestones 2 and 6.
- The consumer's own seam list → the published rule. Consumers: four files in
  `futex-ai/accounting`. They move after the release, outside this
  repository. See the post-merge section.

## Milestone 1: Documentation and protocol

Depends on: none

Update the docs so that they state the RNW route and the decisions.

- [x] `docs/protocol/shared-ui-package.md`: add the RNW route. A consumer that
      draws with RNW applies the published rule in each tool. The route loads
      no DOM-backend module. The rule's shape follows decision 1. Name the
      supported RNW range.
- [x] `docs/protocol/shared-ui-components.md`: the package boundary names both
      web renderers.
- [x] `docs/protocol/drag-select.md`: the takeover sentence for the RNW route,
      as decision 2 chooses.
- [x] `docs/protocol/shared-ui-theming.md`: record the known gap of the RNW
      route, as decision 3 chooses. On RNW, focus can drop a resting shadow,
      and an inline resting shadow hides the glow.
- [x] Record the icon list requirement in `shared-ui-package.md`, as decision
      4 chooses.
- [x] `README.md` "Installation": add the RNW route with its packages and the
      rule. Correct the sentences on the Metro conditions.
- [x] `docs/development.md` "Package export map": add the rule's entry.
- [x] `src/primitives/README.md`: the seam table gets an RNW column. The link
      host section moved to Milestone 3, because it describes code that
      Milestone 3 changes.
- [x] Update `plans/follow-ups/docs-name-react-native-web.md` for the RNW
      route.

## Milestone 2: The stylesheet and the responder globals

Depends on: none

- [x] Move the library stylesheet and the hide-scrollbar attribute out of
      `dom/` into a shared web module. `dom/`, `themeRoot.web.tsx`, and
      `dragSelectableScrollbar.ts` import them from there.
      `domBackendCss.web.ts` keeps its output.
- [x] Rename the responder globals of `dom/responder`.
- [x] Update `tests/unit/primitives.test.ts` for the moved module. Run
      `focusRingCss`, `domResponder`, and the drag-select and focus-ring
      browser specs.

## Milestone 3: One link host for both web renderers

Tags: ui

Depends on: 1, 2

Build `link.web.tsx` over the seam `View`, as the design calls say.

- [x] Move `usePress`, `pressMachine`, and `useHover` out of `dom/` to a
      shared web module. The DOM `Pressable` keeps its behaviour.
- [x] Rewrite `link.web.tsx` over the seam `View`. Delete `dom/Link.tsx` and
      its export from `dom/index.ts`.
- [x] `src/primitives/README.md`: the link row of the seam table and the
      link host section say that one host serves both renderers.
- [x] Move `tests/unit/link.test.ts` to the new host. Run
      `tests/browser/link.spec.ts` and `tests/browser/list.spec.ts` with no
      baseline change.

## Milestone 4: The seam table and the published rule

Depends on: 2, 3

Add the seam table and the rule in the shape of decision 1.

- [x] Add `src/primitives/rnwForms.ts` and a unit test that fails when a seam
      pair has no entry.
- [x] Generate the rule module and its table in the build. Add its entry to
      the export map with its types.
- [x] Unit tests for the rule: requests from both trees, with and without an
      extension, from inside and outside Firna's `dist`, a request that is not
      a seam, and a seam whose form is `web`.
- [x] A `test:dist` test checks that each native RNW form imports only
      packages.
- [x] Add `react-native-web` and `esbuild` as devDependencies.
- [x] A `test:dist` test bundles every public subpath with esbuild through
      the rule, with `react-native` aliased to `react-native-web`, and finds no
      file under `primitives/dom/`.
- [x] Extend `scripts/package-smoke.mjs`: the packed package resolves the
      rule's subpath from CommonJS and from an ES module.

## Milestone 5: The RNW harness and the link row test

Depends on: 4, 7

- [x] Add a browser spec that bundles a harness with esbuild, RNW, and the
      published rule, as a consumer applies it.
- [x] Render a `List` with a link row. Assert a real `a` element with its
      `href`. Assert that a plain click runs `onNavigate` and loads no page,
      that a Ctrl or Meta click does not run it, and that `newTab` and
      `current` give their attributes.
- [x] Add an RNW harness case for the stylesheet of Milestone 7: a focus host
      shows the glow with no `SharedUiThemeProvider`.
- [x] Add an RNW harness case for the toast live region of Milestone 7: the
      element has `aria-atomic`.

## Milestone 6: The press takeover on both renderers

Depends on: 3, 5

- [x] Drag-select imports `endPointerPresses` from the shared press module.
- [x] Remove the exception for `src/drag-select/dragSelectableSessionDom.ts`
      from the check in `tests/unit/primitives.test.ts` that no file outside
      `src/primitives` imports `primitives/dom`.
- [x] Implement the takeover as decision 2 chooses.
- [x] `docs/protocol/drag-select.md` "Press takeover": state that the claim
      runs on both renderers and also ends a responder gesture of the same
      press.
- [x] Extend the RNW harness: a drag that starts on a button and a drag that
      starts on a link row each end the press, with the events that the
      protocol names, also inside a scroll view. Run the drag-select browser
      specs with no other change.

## Milestone 7: Other RNW fixes

Tags: ui

Depends on: 3

- [x] Add the follow-up item for decision 3 under `plans/follow-ups/`, with
      options B, C, and D of the decision and the check's corrections.
- [x] `useFocusRing` injects the library stylesheet on web. Milestone 5 adds
      the RNW harness case.
- [x] Set `aria-atomic` on the toast live region element. Correct the comment
      at `src/toast/ToastLiveRegion.tsx:125-126`. Milestone 5 adds the RNW
      harness case.
- [x] Correct the comments in the four drag hooks that say RNW's `Pressable`
      stops `pointerdown`.

## Milestone 8: The icon list

Depends on: 4

- [x] Publish the icon names as decision 4 chooses, generated at build time,
      with a unit test that the list holds `ArrowUpRight` for `list` and
      `link`.

## Milestone 9: Verification, commit, review, and pull request

Depends on: every other milestone

- [x] Update every follow-up item that this branch makes stale, with the
      report `.context/react-native-web-seam-contract/follow-up-check.md` as
      input. Then run a fresh follow-up check, as the `plans` skill says.
- [x] Run the targeted tests and the complete gate, `cargo xtask check`.
- [x] Commit with Conventional Commits and push the branch.
- [x] Review the complete local diff against `origin/main` with the
      `implementation-review` skill after the push. Report the findings, then
      apply the fix rule: fix the `fix now` findings, record follow-up items
      under `plans/follow-ups/` for the rest, re-review once, and report.
- [x] Add follow-up items for the RNW caveats outside this scope: the calendar
      time grid cancels `pointerdown`, the panel resize handle and the link
      host show press-in on an enclosing RNW `Pressable`, `pointerEvents`
      passed as a prop warns on RNW, the rich-text editor warns twice on RNW,
      and `src/calendar/CalendarToolbar.tsx:80` and
      `src/data-grid/DataGridAddRow.tsx:35` can show no focus indicator.
- [ ] Delete this plan when the `plans` skill says, under "Deleting the plan".
- [ ] Open the pull request with `gh pr create --base main`. Its description
      gives the decisions and the design calls of this plan with their dates,
      a permalink to this plan, and the follow-up items that the change adds.

## Post-merge follow-up (non-blocking)

- [ ] Create a new workspace for the follow-up item of decision 3, as Cal
      asked on 2026-11-27.

- [ ] Bookfolio adopts the release in `futex-ai/accounting`: it replaces its
      resolver and the three test copies of the seam list with the published
      rule, adds the icons of the published list to its curated runtimes, and
      takes the 5.0.0 drag-select changes. This is outside this repository.
