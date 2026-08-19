import { act, renderHook, waitFor } from "@testing-library/react";
import { useTodos } from "@/hooks/use-todos";

beforeEach(() => {
  localStorage.clear();
});

describe("useTodos 우선순위", () => {
  it("addTodo에 전달한 우선순위로 추가한다", () => {
    const { result } = renderHook(() => useTodos());

    act(() => {
      result.current.addTodo("장보기", "high");
    });

    expect(result.current.todos[0]).toMatchObject({
      text: "장보기",
      priority: "high",
      completed: false,
    });
  });

  it("우선순위를 생략하면 기본값(medium)으로 추가한다", () => {
    const { result } = renderHook(() => useTodos());

    act(() => {
      result.current.addTodo("청소");
    });

    expect(result.current.todos[0].priority).toBe("medium");
  });

  it("priority가 없는 기존 저장 데이터는 medium으로 보정해 로드한다", async () => {
    localStorage.setItem(
      "todos",
      JSON.stringify([{ id: "1", text: "구버전 할 일", completed: false }])
    );

    const { result } = renderHook(() => useTodos());

    await waitFor(() => expect(result.current.loaded).toBe(true));
    expect(result.current.todos).toHaveLength(1);
    expect(result.current.todos[0].priority).toBe("medium");
  });

  it("추가한 우선순위를 localStorage에 저장한다", async () => {
    const { result } = renderHook(() => useTodos());

    act(() => {
      result.current.addTodo("장보기", "low");
    });

    await waitFor(() => {
      const stored = JSON.parse(localStorage.getItem("todos") ?? "[]");
      expect(stored[0]?.priority).toBe("low");
    });
  });
});

describe("useTodos 마감일", () => {
  it("addTodo에 전달한 마감일로 추가한다", () => {
    const { result } = renderHook(() => useTodos());

    act(() => {
      result.current.addTodo("회의", "medium", "2026-07-01");
    });

    expect(result.current.todos[0]).toMatchObject({
      text: "회의",
      dueDate: "2026-07-01",
    });
  });

  it("마감일을 생략하면 dueDate 없이 추가한다", () => {
    const { result } = renderHook(() => useTodos());

    act(() => {
      result.current.addTodo("청소");
    });

    expect(result.current.todos[0].dueDate).toBeUndefined();
  });

  it("새로 추가한 Todo에는 생성 시각(createdAt)이 기록된다", () => {
    const { result } = renderHook(() => useTodos());

    act(() => {
      result.current.addTodo("회의");
    });

    expect(typeof result.current.todos[0].createdAt).toBe("number");
  });

  it("createdAt이 없는 기존 데이터는 number로 보정해 로드한다", async () => {
    localStorage.setItem(
      "todos",
      JSON.stringify([
        { id: "1", text: "구버전 할 일", completed: false, priority: "medium" },
      ])
    );

    const { result } = renderHook(() => useTodos());

    await waitFor(() => expect(result.current.loaded).toBe(true));
    expect(typeof result.current.todos[0].createdAt).toBe("number");
  });
});

describe("useTodos 카테고리", () => {
  it("addTodo에 전달한 카테고리로 추가한다", () => {
    const { result } = renderHook(() => useTodos());

    act(() => {
      result.current.addTodo("보고서", "medium", undefined, "work");
    });

    expect(result.current.todos[0].category).toBe("work");
  });

  it("카테고리를 생략하면 category 없이 추가한다", () => {
    const { result } = renderHook(() => useTodos());

    act(() => {
      result.current.addTodo("청소");
    });

    expect(result.current.todos[0].category).toBeUndefined();
  });
});

describe("useTodos 편집", () => {
  it("정상 텍스트로 편집하면 해당 항목의 텍스트만 변경된다", () => {
    const { result } = renderHook(() => useTodos());

    act(() => {
      result.current.addTodo("원래 텍스트");
    });
    const id = result.current.todos[0].id;

    act(() => {
      result.current.editTodo(id, "수정된 텍스트");
    });

    expect(result.current.todos).toHaveLength(1);
    expect(result.current.todos[0].text).toBe("수정된 텍스트");
  });

  it("편집 텍스트의 앞뒤 공백은 제거된다", () => {
    const { result } = renderHook(() => useTodos());

    act(() => {
      result.current.addTodo("원래 텍스트");
    });
    const id = result.current.todos[0].id;

    act(() => {
      result.current.editTodo(id, "  다듬어진 텍스트  ");
    });

    expect(result.current.todos[0].text).toBe("다듬어진 텍스트");
  });

  it("빈 문자열로 편집하면 해당 항목이 삭제된다", () => {
    const { result } = renderHook(() => useTodos());

    act(() => {
      result.current.addTodo("삭제될 할 일");
    });
    const id = result.current.todos[0].id;

    act(() => {
      result.current.editTodo(id, "");
    });

    expect(result.current.todos).toHaveLength(0);
  });

  it("공백만 있는 문자열로 편집해도 삭제 처리된다", () => {
    const { result } = renderHook(() => useTodos());

    act(() => {
      result.current.addTodo("삭제될 할 일");
    });
    const id = result.current.todos[0].id;

    act(() => {
      result.current.editTodo(id, "   ");
    });

    expect(result.current.todos).toHaveLength(0);
  });

  it("여러 항목 중 하나를 빈 문자열로 편집하면 그 항목만 삭제되고 나머지는 유지된다", () => {
    const { result } = renderHook(() => useTodos());

    act(() => {
      result.current.addTodo("할 일 A");
    });
    act(() => {
      result.current.addTodo("할 일 B");
    });
    const idOfB = result.current.todos[0].id;

    act(() => {
      result.current.editTodo(idOfB, "");
    });

    expect(result.current.todos).toHaveLength(1);
    expect(result.current.todos[0].text).toBe("할 일 A");
  });
});

describe("useTodos 저장 실패", () => {
  it("localStorage.setItem이 실패해도 예외를 던지지 않고 상태는 정상 반영된다", async () => {
    const { result } = renderHook(() => useTodos());
    await waitFor(() => expect(result.current.loaded).toBe(true));

    const setItemSpy = vi
      .spyOn(Storage.prototype, "setItem")
      .mockImplementation(() => {
        throw new DOMException("QuotaExceededError");
      });

    expect(() => {
      act(() => {
        result.current.addTodo("저장 실패해도 살아남는 할 일");
      });
    }).not.toThrow();

    expect(result.current.todos[0].text).toBe("저장 실패해도 살아남는 할 일");

    setItemSpy.mockRestore();
  });
});

describe("useTodos 손상 데이터 보호", () => {
  it("파싱할 수 없는 저장값을 빈 배열로 덮어쓰지 않는다", async () => {
    localStorage.setItem("todos", "{이건 JSON이 아님");

    const { result } = renderHook(() => useTodos());

    await waitFor(() => expect(result.current.loaded).toBe(true));
    expect(result.current.todos).toEqual([]);
    // 손상된 원본이 보존돼 복구 여지가 남아야 한다
    expect(localStorage.getItem("todos")).toBe("{이건 JSON이 아님");
  });

  it("배열이 아닌 저장값도 덮어쓰지 않는다", async () => {
    localStorage.setItem("todos", JSON.stringify({ x: 1 }));

    const { result } = renderHook(() => useTodos());

    await waitFor(() => expect(result.current.loaded).toBe(true));
    expect(result.current.todos).toEqual([]);
    expect(localStorage.getItem("todos")).toBe('{"x":1}');
  });

  it("손상 데이터 로드 후 새 항목을 추가하면 정상적으로 저장된다", async () => {
    localStorage.setItem("todos", "{이건 JSON이 아님");

    const { result } = renderHook(() => useTodos());
    await waitFor(() => expect(result.current.loaded).toBe(true));

    act(() => {
      result.current.addTodo("새 할 일");
    });

    await waitFor(() => {
      const stored = JSON.parse(localStorage.getItem("todos") ?? "null");
      expect(Array.isArray(stored)).toBe(true);
      expect(stored[0]?.text).toBe("새 할 일");
    });
  });
});
