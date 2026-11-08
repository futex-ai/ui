/**
 * Browser coverage for button states: press, hover, disabled, keyboard
 * activation, roles, and toggles.
 */
import { expect, test } from "@playwright/test";

test("button reflects press and disabled state", async ({ page }) => {
  await page.goto("/iframe.html?id=button-examples--interactive");

  // Exact match so "Save" does not also resolve the "Saved" button.
  const save = page.getByRole("button", { exact: true, name: "Save" });
  await expect(save).toBeVisible();
  // A button without an enabled handler is exposed as disabled.
  await expect(
    page.getByRole("button", { name: "Unavailable" }),
  ).toBeDisabled();

  // Pressing the primary button swaps its label.
  await save.click();
  await expect(
    page.getByRole("button", { exact: true, name: "Saved" }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { exact: true, name: "Save" }),
  ).toBeHidden();
});

test("button deepens its fill on hover, per tone", async ({ page }) => {
  await page.goto("/iframe.html?id=button-examples--tones");

  const primary = page.getByRole("button", { name: "Primary" });
  const secondary = page.getByRole("button", { name: "Secondary" });
  const ghost = page.getByRole("button", { name: "Ghost" });
  const danger = page.getByRole("button", { name: "Danger" });

  // Resting: the primary tone carries the theme primary fill.
  await expect(primary).toHaveCSS("background-color", "rgb(79, 120, 100)");

  // Hover deepens the filled tone to primaryDeep (raising the white label's
  // contrast), and washes the neutral / ghost tones with their token: soft for
  // the secondary, the primary accent's primarySoft for ghost.
  await primary.hover();
  await expect(primary).toHaveCSS("background-color", "rgb(47, 89, 69)");
  await secondary.hover();
  await expect(secondary).toHaveCSS("background-color", "rgb(238, 242, 237)");
  await ghost.hover();
  await expect(ghost).toHaveCSS("background-color", "rgb(227, 238, 230)");
  // Danger keeps its surface fill (a wash would drop the rose label below AA)
  // and instead firms its border from roseSoft to full rose (rgb(168, 79, 69)).
  await danger.hover();
  await expect(danger).toHaveCSS("background-color", "rgb(255, 255, 255)");
  await expect(danger).toHaveCSS("border-top-color", "rgb(168, 79, 69)");
});

test("disabled button does not take a hover fill", async ({ page }) => {
  await page.goto("/iframe.html?id=button-examples--block-and-disabled");

  const disabled = page.getByRole("button", { name: "Disabled" });
  await expect(disabled).toBeDisabled();
  await expect(disabled).toHaveCSS("background-color", "rgb(255, 255, 255)");
  // Hovering a disabled button leaves its surface fill untouched.
  await disabled.hover({ force: true });
  await expect(disabled).toHaveCSS("background-color", "rgb(255, 255, 255)");
});

test("button activates from the keyboard", async ({ page }) => {
  await page.goto("/iframe.html?id=button-examples--interactive");

  const save = page.getByRole("button", { exact: true, name: "Save" });
  await save.focus();
  await page.keyboard.press("Enter");
  await expect(
    page.getByRole("button", { exact: true, name: "Saved" }),
  ).toBeVisible();
});

test("button activates with the Space key", async ({ page }) => {
  await page.goto("/iframe.html?id=button-examples--interactive");

  const save = page.getByRole("button", { exact: true, name: "Save" });
  await save.focus();
  await page.keyboard.press("Space");
  await expect(
    page.getByRole("button", { exact: true, name: "Saved" }),
  ).toBeVisible();
});

test("button announces the caller's role and the state it carries", async ({
  page,
}) => {
  await page.goto("/iframe.html?id=button-examples--roles-and-states");

  // `role` re-points the button, and the paired state prop lands as the ARIA
  // attribute that role requires (WCAG 2.1 — 4.1.2 Name, Role, Value, A).
  await expect(page.getByRole("tab", { name: "General" })).toHaveAttribute(
    "aria-selected",
    "true",
  );
  await expect(page.getByRole("tab", { name: "Apps" })).toHaveAttribute(
    "aria-selected",
    "false",
  );
  await expect(
    page.getByRole("checkbox", { name: "Email notifications" }),
  ).not.toBeChecked();
  await expect(
    page.getByRole("switch", { name: "Compact rows" }),
  ).toBeChecked();
  await expect(page.getByRole("radio", { name: "Sage" })).toBeChecked();
  await expect(page.getByRole("radio", { name: "Slate" })).not.toBeChecked();
  await expect(page.getByRole("menuitem", { name: "Archive" })).toBeVisible();
  // A toggle button carries `aria-pressed` — the only toggle state ARIA allows
  // on `role="button"`, so `aria-selected` must not appear here.
  const pin = page.getByRole("button", { name: "Pin" });
  await expect(pin).toHaveAttribute("aria-pressed", "false");
  await expect(pin).not.toHaveAttribute("aria-selected", /.*/);
});

test("a re-roled button activates from the keyboard, once per press", async ({
  page,
}) => {
  await page.goto("/iframe.html?id=button-examples--roles-and-states");

  // The web backend binds Spacebar to `button` roles only, so the library wires
  // it for every other role (WCAG 2.1 — 2.1.1 Keyboard, A). Exactly once: a
  // double activation would toggle the checkbox straight back off.
  const notify = page.getByRole("checkbox", { name: "Email notifications" });
  await notify.focus();
  await page.keyboard.press("Space");
  await expect(notify).toBeChecked();

  // Enter stays with the web backend's press machine, which presses on every
  // role — claiming it in the library too would activate twice.
  await page.keyboard.press("Enter");
  await expect(notify).not.toBeChecked();

  const apps = page.getByRole("tab", { name: "Apps" });
  await apps.focus();
  await page.keyboard.press("Space");
  await expect(apps).toHaveAttribute("aria-selected", "true");
  await expect(page.getByRole("tab", { name: "General" })).toHaveAttribute(
    "aria-selected",
    "false",
  );
});

test("a re-roled button keeps the shared focus glow", async ({ page }) => {
  await page.goto("/iframe.html?id=button-examples--roles-and-states");

  // The point of re-roling a Button rather than hand-rolling a Pressable: the
  // control keeps the library's focus affordance instead of falling through to
  // the browser's own outline.
  const apps = page.getByRole("tab", { name: "Apps" });
  await apps.focus();
  const focusStyle = await apps.evaluate((node) => {
    const style = getComputedStyle(node);
    return { boxShadow: style.boxShadow, outlineStyle: style.outlineStyle };
  });
  expect(focusStyle.boxShadow).toContain("rgba(79, 120, 100, 0.35)");
  expect(focusStyle.outlineStyle).toBe("none");
});

test("a toggle button reports its pressed state", async ({ page }) => {
  await page.goto("/iframe.html?id=button-examples--roles-and-states");

  await page.getByRole("button", { name: "Pin" }).click();
  await expect(page.getByRole("button", { name: "Pinned" })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
});
