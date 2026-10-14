/** The ARIA role of a provider's element. */
import type { DragSelectableProviderProps } from "./dragSelectableTypes";

/**
 * An explicit role wins, and `"none"` renders no role. Without one, a named
 * provider is a `group` and an unnamed one has no role, so a page-wide
 * provider adds no anonymous group to the accessibility tree.
 */
export function dragSelectableProviderRole(
  role: DragSelectableProviderProps["role"],
  accessibilityLabel: string | undefined,
): "group" | "list" | undefined {
  if (role === "none") {
    return undefined;
  }
  return role ?? (accessibilityLabel ? "group" : undefined);
}
