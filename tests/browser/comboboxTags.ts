/** Shared steps for the grouped tag picker browser tests. */
import type { Page } from "@playwright/test";

/** The accessible names of the chip remove buttons, in page order. */
export function chipRemoveNames(page: Page) {
  return page
    .getByRole("button", { name: /^Remove / })
    .evaluateAll((buttons) =>
      buttons.map((button) => button.getAttribute("aria-label")),
    );
}
