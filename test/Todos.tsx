import useStateMethods from '../src';
import React, { useMemo, useRef, useEffect } from 'react';

interface TodosProps {
  initialTodos?: TodoItem[];
}

export default function Todos({ initialTodos = [] }: TodosProps) {
  const { todos, filter, addTodo, toggleTodo, setFilter } = useStateMethods(
    {
      nextId: initialTodos.reduce((maxId, nextItem) => Math.max(maxId, nextItem.id), 0) + 1,
      todos: initialTodos,
      filter: 'all',
    },
    methods,
  );

  const visibleTodos = useMemo(() => {
    switch (filter) {
      case 'all':
        return todos;
      case 'completed':
        return todos.filter(t => t.completed);
      case 'active':
        return todos.filter(t => !t.completed);
    }
  }, [todos, filter]);

  const inputRef = useRef<HTMLInputElement>(null);

  // track how many times methods change (should never be more than zero)
  const methodChanges = useRef(-1);
  useEffect(() => {
    methodChanges.current++;
  }, [addTodo, toggleTodo, setFilter]);

  return (
    <>
      <div>
        <form
          onSubmit={e => {
            e.preventDefault();
            const input = inputRef.current!;
            if (!input.value.trim()) {
              return;
            }
            addTodo(input.value);
            input.value = '';
          }}
        >
          <label>
            What to do: <input ref={inputRef} />
          </label>
          <button type="submit">Add Todo</button>
        </form>
      </div>
      <ul>
        {visibleTodos.map(({ id, text, completed }) => (
          <li
            key={id}
            data-testid="todo-item"
            onClick={() => toggleTodo(id)}
            className={completed ? 'complete' : 'incomplete'}
          >
            {text}
          </li>
        ))}
      </ul>
      <div>
        <span>Show: </span>
        {visibilityFilters.map(f => (
          <button key={f} onClick={() => setFilter(f)} disabled={f === filter}>
            {f}
          </button>
        ))}
      </div>
      <label>
        method changes: <span>{methodChanges.current}</span>
      </label>
    </>
  );
}

interface TodosState {
  nextId: number;
  todos: TodoItem[];
  filter: VisibilityFilter;
}

interface TodoItem {
  id: number;
  text: string;
  completed: boolean;
}

type VisibilityFilter = 'all' | 'completed' | 'active';
const visibilityFilters: VisibilityFilter[] = ['all', 'completed', 'active'];

const methods = (state: TodosState) => ({
  addTodo(text: string) {
    state.todos.push({
      id: state.nextId++,
      text,
      completed: false,
    });
  },
  toggleTodo(id: number) {
    const todo = state.todos.find(todo => todo.id === id)!;
    todo.completed = !todo.completed;
  },
  setFilter(filter: VisibilityFilter) {
    state.filter = filter;
  },
});
