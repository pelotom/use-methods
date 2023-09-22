import useMethods from "../src";
import React, { useMemo, useRef, useEffect } from "react";

export type Todos = ReturnType<typeof useTodos>;

export default function useTodos(initialTodos: TodoItem[] = []) {
  const initialState: TodosState = {
    nextId: initialTodos.reduce((maxId, nextItem) => Math.max(maxId, nextItem.id), 0) + 1,
    todos: initialTodos,
    filter: "all",
  };
  const [{ todos, filter }, { addTodo, toggleTodo, setFilter }] = useMethods(methods, initialState);

  const visibleTodos = useMemo(() => {
    switch (filter) {
      case "all":
        return todos;
      case "completed":
        return todos.filter((t) => t.completed);
      case "active":
        return todos.filter((t) => !t.completed);
    }
  }, [todos, filter]);

  // track how many times methods change (should never be more than zero)
  const methodChanges = useRef(-1);
  useEffect(() => {
    methodChanges.current++;
  }, [addTodo, toggleTodo, setFilter]);

  return {
    todos: visibleTodos,
    filter,
    addTodo,
    toggleTodo,
    setFilter,
    methodChanges,
  };
}

interface TodosState {
  nextId: number;
  todos: TodoItem[];
  filter: VisibilityFilter;
}

export interface TodoItem {
  id: number;
  text: string;
  completed: boolean;
}

type VisibilityFilter = "all" | "completed" | "active";
const visibilityFilters: VisibilityFilter[] = ["all", "completed", "active"];

const methods = (state: TodosState) => ({
  addTodo(text: string) {
    if (!text) return;

    state.todos.push({
      id: state.nextId++,
      text,
      completed: false,
    });
  },
  toggleTodo(id: number) {
    const todo = state.todos.find((todo) => todo.id === id)!;
    todo.completed = !todo.completed;
  },
  setFilter(filter: VisibilityFilter) {
    state.filter = filter;
  },
});
