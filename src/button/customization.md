# Button content, events, and styling

These sections extend the [Button README](README.md).

## Imperative focus

`buttonRef` exposes the underlying pressable for callers that must drive focus
themselves. The usual reason is a modal's `initialFocusRef`: `WebModalFrame`
opens focus on the first control the caller rendered, so a destructive
confirmation should point it at the safe action instead.

```tsx
const cancelRef = useRef<View | null>(null);

<WebModalFrame initialFocusRef={cancelRef} /* … */>
  <Button buttonRef={cancelRef} onPress={onClose}>
    Cancel
  </Button>
</WebModalFrame>;
```

The prop is named rather than a forwarded `ref`, matching `InputFrame`'s
`inputRef`.

## Press lifecycle

`onPress` is joined by `onPressIn`, `onPressOut`, `onLongPress`, and
`delayLongPress`, so a control whose meaning is the _hold_ — push-to-talk, a
press-and-hold confirm — is a `Button` rather than a hand-rolled `Pressable`.
`busy` gates the whole lifecycle together, so a control can never start on
press-in and then never be released.

```tsx
<Button
  delayLongPress={400}
  icon={Mic}
  onPress={sendTapMessage}
  onPressIn={startRecording}
  onPressOut={stopRecording}
  tone="primary"
>
  Hold to talk
</Button>
```

The gesture event is forwarded to `onPress`, so a menu trigger can open at the
pointer instead of wrapping the button in a `<View>` and measuring it. It is
**optional** — a keyboard activation has no pointer, and both Enter and Space
call the handler with no event — so anchor to the control itself when it is
absent:

```tsx
<Button onPress={(event) => openMenu(event ? pointOf(event) : anchorRef)}>
  Actions
</Button>
```

## On media

Every other tone composites against a theme surface, so all of them disappear on
a photograph. `onMedia` is a translucent white veil that thickens on hover and
press, with a fixed white label:

```tsx
<Button
  accessibilityLabel="Close preview"
  icon={X}
  onPress={close}
  shape="circle"
  tone="onMedia"
/>
```

Its fills and label are deliberately **not** theme tokens. Imagery is dark
whichever scheme is mounted, so a scheme-aware `onSolid` would invert to dark
text on dark media in the dark presets.

## Label, slots, and cards

`labelStyle` merges over the label after the tone's colour, and `numberOfLines`
truncates it — which has to be set here, because React Native ignores
`numberOfLines` on a nested `<Text>`. `trailing` renders after the label under
the same decorative contract as the leading icon, so a selector can pin a
chevron to its far edge:

```tsx
<Button
  block
  labelStyle={{ flex: 1, textAlign: "left" }}
  numberOfLines={1}
  onPress={openSwitcher}
  trailing={<ChevronDown color={theme.colors.ink} size={16} />}
>
  {workspaceName}
</Button>
```

`content` replaces the icon + label row entirely, for a pressable card that
performs an action. The button keeps its role, focus ring, press handling, and
disabled treatment and stops imposing a label layout; pair it with `style` to
drop the row direction and the fixed track height. There is no visible text for
the library to read a name from, so `accessibilityLabel` is required.

## Styling

`style` extends the pressable container (`ViewStyle`). Tone, size, the focus
ring, and the disabled treatment are applied by the component; `style` layers on
top for one-off layout tweaks (e.g. margins).

Because it layers last, a caller-supplied fill also overrides the tone's own
hover and pressed washes — which is why `style` accepts a function of the
interaction state, so that caller can put press feedback back:

```tsx
<Button
  onPress={archive}
  style={({ pressed }) => [
    { backgroundColor: theme.colors.amberSoft },
    pressed ? { opacity: 0.82 } : null,
  ]}
>
  Archive
</Button>
```

The state is `{ busy, disabled, focused, hovered, pressed }`; `hovered` is
web-only and stays `false` on native.
