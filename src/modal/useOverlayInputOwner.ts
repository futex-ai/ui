/**
 * Input ownership for overlays on native. Native dialogs are platform modals,
 * so an overlay's listeners never receive input meant for a dialog above it.
 * The web build resolves `useOverlayInputOwner.web.ts` instead.
 */

/** Returns a check that always reports that the overlay owns its input. */
export function useOverlayInputOwner(): () => boolean {
  return ownsInput;
}

function ownsInput(): boolean {
  return true;
}
