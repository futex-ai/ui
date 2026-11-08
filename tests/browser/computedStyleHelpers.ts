/** Computed colours of a located element, read in the page. */
import type { Page } from "@playwright/test";

export async function backgroundColor(locator: ReturnType<Page["getByRole"]>) {
  return locator.evaluate(
    (element) => getComputedStyle(element).backgroundColor,
  );
}

export async function textColor(locator: ReturnType<Page["getByText"]>) {
  return locator.evaluate((element) => getComputedStyle(element).color);
}
