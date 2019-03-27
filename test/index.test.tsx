import useMethods from '../src';
import React from 'react';
import { cleanup, render, fireEvent, RenderResult } from 'react-testing-library';
import Todos from './Todos';

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
