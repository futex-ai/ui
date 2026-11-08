/**
 * Browser coverage for radio cards: checked and disabled states, and their
 * accessible names.
 */
import { expect, test } from "@playwright/test";

test("radio cards expose checked and disabled option states", async ({
  page,
}) => {
  await page.goto(
    "/iframe.html?id=radio-examples--accounting-basis-radio-cards",
  );

  const cash = page.getByRole("radio", { name: /Cash basis/ });
  const accrual = page.getByRole("radio", { name: /Accrual basis/ });
  const flatRate = page.getByRole("radio", { name: /Flat rate VAT/ });

  await expect(cash).toBeChecked();
  await accrual.click();
  await expect(accrual).toBeChecked();
  await expect(cash).not.toBeChecked();
  await cash.focus();
  await page.keyboard.press("Space");
  await expect(cash).toBeChecked();
  await expect(accrual).not.toBeChecked();
  await expect(flatRate).toBeDisabled();
});

test("radio card names default to the title and accept overrides", async ({
  page,
}) => {
  await page.goto(
    "/iframe.html?id=radio-examples--distinguishable-radio-cards",
  );

  const recommended = page.getByRole("radio", {
    name: "Cash basis (recommended)",
  });
  const plain = page.getByRole("radio", { exact: true, name: "Cash basis" });
  await expect(recommended).toBeVisible();
  await expect(plain).toBeVisible();
  await expect(recommended).toBeChecked();
  await plain.click();
  await expect(plain).toBeChecked();
  await expect(recommended).not.toBeChecked();
});
