import { expect, test } from "@playwright/test";

test("변환기 화면이 열리고 빈 상태 안내가 보인다", async ({ page }) => {
  await page.goto("/");

  await expect(page).toHaveTitle("URL → Markdown");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("URL → Markdown");
  await expect(page.getByText("변환할 페이지 주소를 붙여넣으세요")).toBeVisible();
});
