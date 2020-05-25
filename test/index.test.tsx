import { HookResult, renderHook, act } from '@testing-library/react-hooks';
import { Patch } from 'immer';
import useMethods, { isDraft, isDraftable, nothing, original, setAutoFreeze, setUseProxies } from '../src';
import useTodos, { Todos } from './useTodos';

describe('todos example', () => {
  let $: HookResult<Todos>;

  afterEach(() => {
    // tests that methods are not recreated on each render
    expect($.current.methodChanges.current).toBeLessThanOrEqual(0);
  });

  describe('with no todos initially', () => {
    beforeEach(() => {
      $ = renderHook(useTodos).result;
    });

    it('is empty initially', () => {
      expect($.current.todos).toHaveLength(0);
    });

    describe('adding a todo', () => {
      it("doesn't work if input is empty", () => {
        $.current.addTodo('');
        expect($.current.todos).toHaveLength(0);
      });

      it('adds an incomplete todo with the input text', () => {
        const todoText = 'climb mt everest';
        act(() => $.current.addTodo(todoText));
        const { todos } = $.current;
        expect(todos).toHaveLength(1);
        const [todo] = todos;
        expect(todo.text).toBe(todoText);
        expect(todo.completed).toBe(false);
      });
    });
  });

  describe('with a single todo initially', () => {
    beforeEach(() => {
      $ = renderHook(useTodos, {
        initialProps: [
          {
            id: 0,
            text: 'hello world',
            completed: false,
          },
        ],
      }).result;
    });

    it('can toggle completeness', () => {
      const { id } = getTodo();
      expect(getTodo().completed).toBe(false);
      act(() => $.current.toggleTodo(id));
      expect(getTodo().completed).toBe(true);
      act(() => $.current.toggleTodo(id));
      expect(getTodo().completed).toBe(false);

      function getTodo() {
        const { todos } = $.current;
        expect(todos).toHaveLength(1);
        return todos[0];
      }
    });

    it('can change filter', () => {
      act(() => $.current.setFilter('completed'));
      expect($.current.todos).toHaveLength(0);
      act(() => $.current.setFilter('active'));
      expect($.current.todos).toHaveLength(1);
      act(() => $.current.toggleTodo($.current.todos[0].id));
      expect($.current.todos).toHaveLength(0);
      act(() => $.current.setFilter('completed'));
      expect($.current.todos).toHaveLength(1);
      act(() => $.current.setFilter('all'));
      expect($.current.todos).toHaveLength(1);
    });
  });
});

it('exports immer helpers', () => {
  expect(typeof isDraft).toBe('function');
  expect(typeof isDraftable).toBe('function');
  expect(typeof nothing).toBe('symbol');
  expect(typeof original).toBe('function');
  expect(typeof setAutoFreeze).toBe('function');
  expect(typeof setUseProxies).toBe('function');
});

it('avoids invoking methods more than necessary', () => {
  let invocations = 0;

  interface State {
    count: number;
  }

  const initialState: State = { count: 0 };

  const methods = (state: State) => ({
    increment() {
      invocations++;
      state.count++;
    },
  });

  const { result } = renderHook(() => useMethods(methods, initialState)[1]);

  expect(invocations).toBe(0);

  act(result.current.increment);

  expect(invocations).toBe(1);

  act(result.current.increment);

  expect(invocations).toBe(2);
});

it('allows lazy initialization', () => {
  // Adapted from https://reactjs.org/docs/hooks-reference.html#lazy-initialization

  interface State {
    count: number;
  }

  const init = (count: number): State => ({ count });

  let invocations = 0;
  const methods = (state: State) => {
    invocations++;
    return {
      increment() {
        state.count++;
      },
      decrement() {
        state.count--;
      },
      reset(newCount: number) {
        return init(newCount);
      },
    };
  };

  function useCounter(initialCount: number) {
    const [state, { reset, ...callbacks }] = useMethods(methods, initialCount, init);
    return { ...state, ...callbacks, reset: () => reset(initialCount) };
  }
  const { result: $, rerender } = renderHook(useCounter, { initialProps: 0 });

  expect($.current.count);

  const expectCount = (count: number) => expect($.current.count).toBe(count);

  expect(invocations).toBe(1);
  expectCount(0);

  act($.current.increment);

  expect(invocations).toBe(2);
  expectCount(1);

  act($.current.increment);

  expect(invocations).toBe(3);
  expectCount(2);

  act($.current.reset);

  expect(invocations).toBe(4);
  expectCount(0);

  act($.current.decrement);

  expect(invocations).toBe(5);
  expectCount(-1);

  rerender(3);

  expect(invocations).toBe(5);
  expectCount(-1);

  act($.current.reset);

  expect(invocations).toBe(6);
  expectCount(3);
});

it('will provide patches', () => {
  interface State {
    count: number;
  }

  const initialState: State = {
    count: 0,
  };

  const patchList: any[] = [];
  const inverseList: any[] = [];

  const methodsObject = {
    methods: (state: State) => ({
      increment() {
        state.count++;
      },
      decrement() {
        state.count--;
      },
    }),
    patchListener: (patches: Patch[], inversePatches: Patch[]) => {
      patchList.push(...patches);
      inverseList.push(...inversePatches);
    },
  };

  function useCounter() {
    const [state, callbacks] = useMethods(methodsObject, initialState);
    return { ...state, ...callbacks };
  }
  const { result: $, rerender } = renderHook(useCounter);

  expect(patchList).toEqual([]);
  expect(inverseList).toEqual([]);

  act($.current.increment);
  expect(patchList).toEqual([{ op: 'replace', path: ['count'], value: 1 }]);
  expect(inverseList).toEqual([{ op: 'replace', path: ['count'], value: 0 }]);

  act($.current.increment);
  act($.current.decrement);
  expect(patchList).toEqual([
    { op: 'replace', path: ['count'], value: 1 },
    { op: 'replace', path: ['count'], value: 2 },
    { op: 'replace', path: ['count'], value: 1 },
  ]);
  expect(inverseList).toEqual([
    { op: 'replace', path: ['count'], value: 0 },
    { op: 'replace', path: ['count'], value: 1 },
    { op: 'replace', path: ['count'], value: 2 },
  ]);
});
