import useMethods from '../src';
import React, { useLayoutEffect, useReducer, useMemo } from 'react';
import { cleanup, render, fireEvent, RenderResult } from 'react-testing-library';
import Todos from './Todos';
import { Patch } from 'immer';

afterEach(cleanup);

describe('todos example', () => {
  let $: RenderResult;

  afterEach(() => {
    // tests that methods are not recreated on each render
    const methodChanges = Number.parseInt($.getByLabelText(/method changes/i).textContent!, 10);
    expect(methodChanges).toBeLessThanOrEqual(0);
  });

  describe('with no todos initially', () => {
    beforeEach(() => {
      $ = render(<Todos />);
    });

    it('is empty initially', () => {
      expect(getTodoItems()).toHaveLength(0);
    });

    describe('adding a todo', () => {
      it("doesn't work if input is empty", () => {
        fireEvent.click($.getByText(/add todo/i));
        expect(getTodoItems()).toHaveLength(0);
      });

      it('adds an incomplete todo with the input text', () => {
        const todoText = 'climb mt everest';
        fireEvent.change($.getByLabelText(/what to do/i), { target: { value: todoText } });
        fireEvent.click($.getByText(/add todo/i));
        const items = getTodoItems();
        expect(items).toHaveLength(1);
        const [item] = items;
        expect(item.textContent).toBe(todoText);
        expect(getStatus(item)).toBe('incomplete');
      });
    });
  });

  describe('with a single todo initially', () => {
    let item: HTMLElement;

    beforeEach(() => {
      $ = render(<Todos initialTodos={[{ id: 0, text: 'hello world', completed: false }]} />);
      const items = getTodoItems();
      expect(items).toHaveLength(1);
      [item] = items;
    });

    it('can toggle completeness', () => {
      expect(getStatus(item)).toBe('incomplete');
      fireEvent.click(item);
      expect(getStatus(item)).toBe('complete');
      fireEvent.click(item);
      expect(getStatus(item)).toBe('incomplete');
    });

    it('can change filter', () => {
      fireEvent.click($.getByText('completed'));
      expect(getTodoItems()).toHaveLength(0);
      fireEvent.click($.getByText('active'));
      const items = getTodoItems();
      expect(items).toHaveLength(1);
      fireEvent.click(items[0]);
      expect(getTodoItems()).toHaveLength(0);
      fireEvent.click($.getByText('completed'));
      expect(getTodoItems()).toHaveLength(1);
      fireEvent.click($.getByText('all'));
      expect(getTodoItems()).toHaveLength(1);
    });
  });

  function getTodoItems() {
    return $.queryAllByTestId('todo-item');
  }

  function getStatus(item: HTMLElement) {
    return item.classList.value;
  }
});

it('avoids invoking methods more than necessary', () => {
  const buttonText = 'click me!';

  let invocations = 0;

  function Test() {
    const { increment } = useMethods(methods, { count: 0 })[1];
    return <button onClick={increment}>{buttonText}</button>;
  }

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

  const button = render(<Test />).getByText(buttonText);

  expect(invocations).toBe(0);

  fireEvent.click(button);

  expect(invocations).toBe(1);

  fireEvent.click(button);

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

  interface CounterProps {
    initialCount: number;
  }

  const testId = 'counter-testid';

  function Counter({ initialCount }: CounterProps) {
    const [state, { increment, decrement, reset }] = useMethods(methods, initialCount, init);
    return (
      <>
        Count: <span data-testid={testId}>{state.count}</span>
        <button onClick={increment}>+</button>
        <button onClick={decrement}>-</button>
        <button onClick={() => reset(initialCount)}>Reset</button>
      </>
    );
  }

  const $ = render(<Counter initialCount={0} />);

  const expectCount = (count: number) =>
    expect(Number.parseInt($.getByTestId(testId).textContent!, 10)).toBe(count);

  expect(invocations).toBe(1);
  expectCount(0);

  fireEvent.click($.getByText('+'));

  expect(invocations).toBe(2);
  expectCount(1);

  fireEvent.click($.getByText('+'));

  expect(invocations).toBe(3);
  expectCount(2);

  fireEvent.click($.getByText(/reset/i));

  expect(invocations).toBe(4);
  expectCount(0);

  fireEvent.click($.getByText('-'));

  expect(invocations).toBe(5);
  expectCount(-1);

  $.rerender(<Counter initialCount={3} />);

  expect(invocations).toBe(5);
  expectCount(-1);

  fireEvent.click($.getByText(/reset/i));

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

  const testId = 'counter-testid';

  function Counter() {
    const [state, { increment, decrement }] = useMethods(methodsObject, initialState);
    return (
      <>
        Count: <span data-testid={testId}>{state.count}</span>
        <button onClick={increment}>+</button>
        <button onClick={decrement}>-</button>
      </>
    );
  }

  const $ = render(<Counter />);

  expect(patchList).toEqual([]);
  expect(inverseList).toEqual([]);

  fireEvent.click($.getByText('+'));
  expect(patchList).toEqual([{ op: 'replace', path: ['count'], value: 1 }]);
  expect(inverseList).toEqual([{ op: 'replace', path: ['count'], value: 0 }]);

  fireEvent.click($.getByText('+'));
  fireEvent.click($.getByText('-'));
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
