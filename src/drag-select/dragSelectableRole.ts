/** The ARIA role and the accessible name of a provider's element. */
import type { DragSelectableProviderProps } from "./dragSelectableTypes";

/** The role and the name that a provider's element renders. */
export type DragSelectableProviderAccessibility = {
  accessibilityLabel: string | undefined;
  role: "group" | "list" | undefined;
};

/**
 * An explicit role wins. `"none"` renders no role and no name, because an
 * element without a role cannot be named. Without a role, a named provider
 * is a `group` and an unnamed one has no role, so a page-wide provider adds
 * no anonymous group to the accessibility tree.
 */
export function dragSelectableProviderAccessibility(
  role: DragSelectableProviderProps["role"],
  accessibilityLabel: string | undefined,
): DragSelectableProviderAccessibility {
  if (role === "none") {
    return { accessibilityLabel: undefined, role: undefined };
  }
  return {
    accessibilityLabel,
    role: role ?? (accessibilityLabel ? "group" : undefined),
  };
}
