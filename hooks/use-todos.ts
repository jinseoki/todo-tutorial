"use client";

import { useEffect, useRef, useState } from "react";
import {
  DEFAULT_PRIORITY,
  type Category,
  type Priority,
  type Todo,
} from "@/lib/types";

const STORAGE_KEY = "todos";

export function useTodos() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [loaded, setLoaded] = useState(false);
  // 로드 시 파싱 실패 여부 — 손상된 localStorage를 빈 배열로 덮어쓰지 않기 위해 사용
  const loadErrorRef = useRef(false);

  // 마운트 후 localStorage에서 로드 (SSR hydration mismatch 방지)
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        // priority/createdAt 도입 이전에 저장된 데이터와의 호환을 위해 기본값으로 보정
        const parsed = JSON.parse(stored) as (Omit<
          Todo,
          "priority" | "createdAt"
        > & {
          priority?: Priority;
          createdAt?: number;
        })[];
        // createdAt이 없던 데이터는 기존 배열 순서(앞쪽이 최신)를 유지하도록
        // index가 작을수록 큰 값을 부여한다.
        const base = Date.now();
        // 마운트 후 localStorage 값으로 동기화 — hydration mismatch 방지를 위해 의도적으로 effect에서 설정
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setTodos(
          parsed.map((todo, index) => ({
            ...todo,
            priority: todo.priority ?? DEFAULT_PRIORITY,
            createdAt: todo.createdAt ?? base - index,
          }))
        );
      }
    } catch {
      // 파싱 실패 시 빈 목록 유지하되, 손상된 데이터를 자동으로 덮어쓰지 않도록 표시
      loadErrorRef.current = true;
    }
    setLoaded(true);
  }, []);

  // 변경 시 저장 (로드 완료 후에만 — 초기 빈 배열이 기존 데이터를 덮어쓰지 않도록)
  useEffect(() => {
    if (!loaded) return;
    // 로드 실패 후 사용자가 아무것도 추가하지 않았다면 손상된 원본을 빈 배열로 덮어쓰지 않는다.
    if (loadErrorRef.current && todos.length === 0) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(todos));
    } catch {
      // 저장 용량 초과 등으로 실패해도 앱 상태에는 영향을 주지 않는다
    }
  }, [todos, loaded]);

  function addTodo(
    text: string,
    priority: Priority = DEFAULT_PRIORITY,
    dueDate?: string,
    category?: Category
  ) {
    const trimmed = text.trim();
    if (!trimmed) return;
    const todo: Todo = {
      id: crypto.randomUUID(),
      text: trimmed,
      completed: false,
      priority,
      createdAt: Date.now(),
      dueDate: dueDate || undefined,
      category,
    };
    setTodos((prev) => [todo, ...prev]);
  }

  function toggleTodo(id: string) {
    setTodos((prev) =>
      prev.map((todo) =>
        todo.id === id ? { ...todo, completed: !todo.completed } : todo
      )
    );
  }

  function deleteTodo(id: string) {
    setTodos((prev) => prev.filter((todo) => todo.id !== id));
  }

  function editTodo(id: string, text: string) {
    const trimmed = text.trim();
    // 빈 문자열로 편집하면 삭제 처리
    if (!trimmed) {
      deleteTodo(id);
      return;
    }
    setTodos((prev) =>
      prev.map((todo) =>
        todo.id === id ? { ...todo, text: trimmed } : todo
      )
    );
  }

  return { todos, loaded, addTodo, toggleTodo, deleteTodo, editTodo };
}
