# Touch surface

The public entry for the explicit touch-surface marker and its hook.
Both are also available from `@firna/ui`.

## Usage

```tsx
import { TouchSurface, useTouchSurface } from "@firna/ui/touch-surface";
import type { TouchSurfaceProps } from "@firna/ui/touch-surface";
```

`TouchSurfaceProps` describes the marker's children and optional `enabled` flag.
The implementation's target-size constant and metric helpers remain private.

## Key Code

- [`index.ts`](index.ts): the public component, hook, and prop type.
- [`../touchSurface.tsx`](../touchSurface.tsx): the context and its implementation.

## Related Docs

- [App shell parts protocol](../../docs/protocol/app-shell-parts.md#touch-surfaces):
  the touch-target requirements.
