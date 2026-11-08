/**
 * Browser coverage for the spinner, the loaders, and the progress bar and ring.
 */
import { expect, test } from "@playwright/test";

test("spinner renders an accessible, continuously rotating loading indicator", async ({
  page,
}) => {
  await page.goto("/iframe.html?id=spinner-examples--loading-states");

  const spinner = page.getByRole("progressbar", { name: "Loading" }).first();
  await expect(spinner).toBeVisible();
  await expect(spinner).toHaveAttribute("aria-busy", "true");

  // The default md spinner is a 24px ring. Its box stays stable because only the
  // inner ring rotates, not the labelled container (a rotating square's
  // axis-aligned box would otherwise oscillate).
  const box = await spinner.boundingBox();
  expect(box?.width).toBeGreaterThanOrEqual(23);
  expect(box?.width).toBeLessThanOrEqual(25);

  // The leading arc is a distinct SVG stroke painted in the theme primary, not a
  // uniform ring, so the moving segment stays visible (also on native).
  await expect(
    spinner.locator('circle[stroke="#4f7864"]').first(),
  ).toBeAttached();

  // The ring genuinely spins: its transform matrix keeps advancing, so a later
  // sample differs from the first one.
  const readRingTransform = () =>
    spinner.evaluate((node) => {
      const ring = node.firstElementChild as HTMLElement | null;
      return ring ? getComputedStyle(ring).transform : "none";
    });
  const firstTransform = await readRingTransform();
  await expect.poll(readRingTransform).not.toBe(firstTransform);
});

test("every loader variant is an animated, labelled progressbar", async ({
  page,
}) => {
  await page.goto("/iframe.html?id=loader-examples--variants");

  const variants = [
    "ring",
    "dot-grid",
    "dots",
    "bars",
    "blades",
    "pulse",
  ] as const;

  for (const variant of variants) {
    const loader = page.getByRole("progressbar", {
      name: `Loading ${variant}`,
    });
    await expect(loader).toBeVisible();
    await expect(loader).toHaveAttribute("aria-busy", "true");

    // Every variant occupies the same md box height, so one can replace another
    // without the surrounding layout shifting.
    const box = await loader.boundingBox();
    expect(box?.height).toBeGreaterThanOrEqual(23);
    expect(box?.height).toBeLessThanOrEqual(25);

    // The animation is real: some descendant keeps changing. Both opacity and
    // transform are sampled because the shapes differ — `blades` never moves and
    // animates brightness alone, while `ring` only turns.
    const readAnimatedStyles = () =>
      loader.evaluate((node) =>
        Array.from(node.querySelectorAll("*"))
          .map((child) => {
            const style = getComputedStyle(child);
            return `${style.opacity}|${style.transform}`;
          })
          .join(","),
      );
    const first = await readAnimatedStyles();
    await expect
      .poll(readAnimatedStyles, { message: `${variant} keeps animating` })
      .not.toBe(first);
  }
});

test("progress bar and ring publish a percentage, or a busy state when unknown", async ({
  page,
}) => {
  await page.goto("/iframe.html?id=loader-examples--progress");

  // A determinate bar reports its value on ARIA's default 0-100 range, so a
  // screen reader announces "42%" rather than "0.42".
  const bar = page.getByRole("progressbar", { name: "Uploading" });
  await expect(bar).toHaveAttribute("aria-valuenow", "42");
  await expect(bar).toHaveAttribute("aria-valuemin", "0");
  await expect(bar).toHaveAttribute("aria-valuemax", "100");

  // An indeterminate bar publishes busy and no value, per ARIA.
  const sweeping = page.getByRole("progressbar", { name: "Syncing" });
  await expect(sweeping).toHaveAttribute("aria-busy", "true");
  await expect(sweeping).not.toHaveAttribute("aria-valuenow", /.*/);

  // The sweeping segment is narrower than its track and keeps travelling.
  const segment = sweeping.locator("div").first();
  const trackBox = await sweeping.boundingBox();
  const segmentBox = await segment.boundingBox();
  expect(segmentBox?.width).toBeLessThan(trackBox?.width ?? 0);
  const readTransform = () =>
    segment.evaluate((node) => getComputedStyle(node).transform);
  const firstTransform = await readTransform();
  await expect.poll(readTransform).not.toBe(firstTransform);

  const ring = page.getByRole("progressbar", { name: "Quota used" });
  await expect(ring).toHaveAttribute("aria-valuenow", "60");
  // The arc is a real SVG stroke in the theme primary, dashed to the fraction.
  await expect(ring.locator('circle[stroke="#4f7864"]')).toBeAttached();
});

test("a zero-value progress ring paints no arc at all", async ({ page }) => {
  await page.goto("/iframe.html?id=loader-examples--progress");

  const ring = page.getByRole("progressbar", { name: "Storage used" });
  await expect(ring).toHaveAttribute("aria-valuenow", "25");

  // A round line cap on a zero-length dash would still paint a dot, so the arc
  // is dropped entirely at 0 rather than drawn with an empty dasharray.
  const ringAtFull = page.getByRole("progressbar", { name: "Import complete" });
  await expect(ringAtFull).toHaveAttribute("aria-valuenow", "100");
  await expect(ringAtFull.locator('circle[stroke="#4f7864"]')).toBeAttached();
});
