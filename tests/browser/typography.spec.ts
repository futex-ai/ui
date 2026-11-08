/**
 * Browser coverage for the compact text scale. A provider chooses the scale
 * for a surface and one text can override it, which only rendered text shows,
 * so these checks read the Compact scale story.
 */
import { expect, test, type Locator } from "@playwright/test";

const roles = [
  "Heading 1",
  "Heading 2",
  "Heading 3",
  "Heading 4",
  "Heading 5",
  "Body text",
  "Label text",
  "Caption text",
  "Overline text",
];

async function textMetrics(text: Locator) {
  await expect(text).toBeVisible();
  // The computed size and line are what the reader sees; no web-first
  // assertion compares two of them, so read both and compare in the test.
  return text.evaluate((element) => {
    const style = getComputedStyle(element);
    return {
      fontSize: parseFloat(style.fontSize),
      lineHeight: parseFloat(style.lineHeight),
    };
  });
}

test("a compact surface shrinks every text role and one text keeps the default scale", async ({
  page,
}) => {
  await page.goto(
    "/iframe.html?id=typography-examples--compact-scale&viewMode=story",
  );
  const defaults = page.getByRole("group", { name: "Default scale" });
  const compact = page.getByRole("group", { name: "Compact scale" });

  // No compact role is larger than the same default role.
  for (const role of roles) {
    const before = await textMetrics(defaults.getByText(role, { exact: true }));
    const after = await textMetrics(compact.getByText(role, { exact: true }));
    expect(after.fontSize, `${role} size`).toBeLessThanOrEqual(before.fontSize);
    expect(after.lineHeight, `${role} line`).toBeLessThanOrEqual(
      before.lineHeight,
    );
  }

  // Compact body text is 13px on a 20px line; the default stays 15px on 22px.
  const compactBody = compact.getByText("Body text", { exact: true });
  await expect(compactBody).toHaveCSS("font-size", "13px");
  await expect(compactBody).toHaveCSS("line-height", "20px");
  const defaultBody = defaults.getByText("Body text", { exact: true });
  await expect(defaultBody).toHaveCSS("font-size", "15px");
  await expect(defaultBody).toHaveCSS("line-height", "22px");

  // One text inside the compact surface keeps the default scale.
  const override = page.getByText("This text keeps the default scale.");
  await expect(override).toHaveCSS("font-size", "15px");
  await expect(override).toHaveCSS("line-height", "22px");

  // The compact headings keep their heading levels.
  for (const level of [1, 2, 3, 4, 5]) {
    await expect(
      compact.getByRole("heading", { level, name: `Heading ${level}` }),
    ).toBeVisible();
  }
});
