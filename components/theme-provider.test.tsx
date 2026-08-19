import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { ThemeProvider } from "@/components/theme-provider";

function renderWithTheme(children: ReactNode = <div />) {
  return render(
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
      {children}
    </ThemeProvider>
  );
}

async function waitForInitialLightTheme() {
  await waitFor(() =>
    expect(document.documentElement.classList.contains("light")).toBe(true)
  );
}

beforeEach(() => {
  document.documentElement.className = "";
  localStorage.clear();

  // jsdom은 matchMedia를 구현하지 않아 next-themes의 시스템 테마 감지 코드가 그대로 던진다.
  window.matchMedia = vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }));
});

describe("ThemeHotkey", () => {
  it("d 키를 누르면 라이트 테마를 다크 테마로 토글한다", async () => {
    renderWithTheme();
    await waitForInitialLightTheme();

    fireEvent.keyDown(window, { key: "d" });

    await waitFor(() =>
      expect(document.documentElement.classList.contains("dark")).toBe(true)
    );
  });

  it("Ctrl+d 등 보조 키와 함께 누르면 토글하지 않는다", async () => {
    renderWithTheme();
    await waitForInitialLightTheme();

    fireEvent.keyDown(window, { key: "d", ctrlKey: true });
    fireEvent.keyDown(window, { key: "d", metaKey: true });
    fireEvent.keyDown(window, { key: "d", altKey: true });

    expect(document.documentElement.classList.contains("dark")).toBe(false);
    expect(document.documentElement.classList.contains("light")).toBe(true);
  });

  it("키를 꾹 눌러 반복 입력(repeat)되면 토글하지 않는다", async () => {
    renderWithTheme();
    await waitForInitialLightTheme();

    fireEvent.keyDown(window, { key: "d", repeat: true });

    expect(document.documentElement.classList.contains("dark")).toBe(false);
  });

  it("d가 아닌 다른 키는 무시한다", async () => {
    renderWithTheme();
    await waitForInitialLightTheme();

    fireEvent.keyDown(window, { key: "a" });

    expect(document.documentElement.classList.contains("dark")).toBe(false);
  });

  it("입력창(input)에 포커스된 상태에서 d를 입력해도 테마가 바뀌지 않는다", async () => {
    renderWithTheme(<input aria-label="할 일 검색" />);
    await waitForInitialLightTheme();

    const input = screen.getByLabelText("할 일 검색");
    input.focus();
    fireEvent.keyDown(input, { key: "d" });

    expect(document.documentElement.classList.contains("dark")).toBe(false);
  });

  it("textarea에 포커스된 상태에서 d를 입력해도 테마가 바뀌지 않는다", async () => {
    renderWithTheme(<textarea aria-label="메모" />);
    await waitForInitialLightTheme();

    const textarea = screen.getByLabelText("메모");
    textarea.focus();
    fireEvent.keyDown(textarea, { key: "d" });

    expect(document.documentElement.classList.contains("dark")).toBe(false);
  });
});
