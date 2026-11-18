import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, test, vi } from "vitest";

import Home from "@/app/page";

vi.mock("next-themes", () => ({
  useTheme: () => ({ resolvedTheme: "light", setTheme: vi.fn() }),
}));

test("빈 상태 안내와 입력 컨트롤을 보여준다", () => {
  render(<Home />);
  expect(screen.getByText("변환할 페이지 주소를 붙여넣으세요")).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "변환" })).toBeEnabled();
  expect(screen.getByRole("button", { name: "지우기" })).toBeInTheDocument();
});

test("URL 형식이 아니면 요청 없이 입력 오류를 보여준다", async () => {
  const fetchSpy = vi.spyOn(globalThis, "fetch");
  render(<Home />);
  await userEvent.type(screen.getByLabelText("웹 페이지 URL"), "not a url");
  await userEvent.click(screen.getByRole("button", { name: "변환" }));
  expect(screen.getByText(/http:\/\/ 또는 https:\/\/로 시작/)).toBeInTheDocument();
  expect(fetchSpy).not.toHaveBeenCalled();
});
