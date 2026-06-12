/** Outside-click helper for dropdown roots rendered through a portal. */

export type DropdownNode = {
  contains: (target: EventTarget | null) => boolean;
};

export function dropdownShouldClose(
  nodes: Array<DropdownNode | null>,
  target: EventTarget | null,
): boolean {
  return nodes.every((node) => !node?.contains(target));
}
