import { expect, test } from "@playwright/test";

test("처음 온 사용자가 세 가지 핵심 행동을 완료한다", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByText("웹 애플리케이션의 인증·인가 우회 경로 분석 및 다중 보안 통제 적용에 따른 취약점 개선 효과 평가")).toBeVisible();
  await expect(page.getByText("방어 장치 배치", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "다중 통제 완성" }).click();
  await page.getByRole("button", { name: "×1" }).click();
  await page.getByRole("button", { name: "×2" }).click();
  await page.getByRole("button", { name: "공격 웨이브 시작" }).click();
  await expect(page.getByText("16개 공격을 모두 차단했습니다")).toBeVisible({ timeout: 30000 });
  await page.getByRole("button", { name: /AUTH-01/ }).click();
  await expect(page.getByRole("heading", { name: "사용자 열거" })).toBeVisible();
  await expect(page.getByText("취약 원인", { exact: true })).toBeVisible();
});

test("예산 초과와 실행 중 중복 입력을 안전하게 막는다", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "다중 통제 완성" }).click();
  await page.getByRole("button", { name: /소유권 검문소/ }).click();
  const launch = page.getByRole("button", { name: "공격 웨이브 시작" });
  await launch.click();
  await expect(page.getByRole("button", { name: "공격 진행 중…" })).toBeDisabled();
  await page.getByRole("button", { name: "중단·초기화" }).click();
  await expect(page.getByRole("button", { name: "공격 웨이브 시작" })).toBeEnabled();
});
