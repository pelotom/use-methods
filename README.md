# `use-methods` [![Build Status](https://travis-ci.com/pelotom/use-methods.svg?branch=master)](https://travis-ci.com/pelotom/use-methods)

This library exports a single React hook, `useMethods`, which has all the power of `useReducer` with none of the ceremony of actions. Instead of providing a single "reducer" function which is one giant switch statement over an action type, you provide a set of "methods" which modify the state or return new states. Likewise, what you get back is not a single `dispatch` function but a set of callbacks corresponding to your methods.

## Example

```js
import useMethods from 'use-methods';

function Counter() {

  const [
    { count }, // <- your state
    { reset, increment, decrement }, // <- callbacks for modifying state
  ] = useMethods(initialState, methods);

  return (
    <>
      Count: {count}
      <button onClick={reset}>Reset</button>
      <button onClick={increment}>+</button>
      <button onClick={decrement}>-</button>
    </>
  );
}

const initialState = { count: 0 };

const methods = state => ({
  reset() {
    return initialState;
  },
  increment() {
    state.count++;
  },
  decrement() {
    state.count--;
  },
});
```

## Immutability

`use-methods` is built on [`immer`](https://github.com/mweststrate/immer), which allows you to write your methods in an imperative, mutating style, even though the actual state managed behind the scenes is immutable. You can also return entirely new states from your methods where it's more convenient to do so (as in the `reset` example above).

## Memoization

Like the `dispatch` method returned from `useReducer`, the callbacks returned from `useMethods` aren't recreated on each render, so they will not be the cause of needless re-rendering if passed as bare props to `React.memo`ized subcomponents. Save your `useCallback`s for functions that don't map exactly to an existing callback!

## Types

This library is built in TypeScript, and for TypeScript users it offers an additional benefit: one no longer needs to declare action types. The example above, if we were to write it in TypeScript with `useReducer`, would require the declaration of an `Action` type:

```ts
type Action =
  | { type: 'reset' }
  | { type: 'increment' }
  | { type: 'decrement' };
```

With `useMethods` the "actions" are implicitly derived from your methods, so you don't need to maintain this extra type artifact.

If you need to obtain the type of the resulting state + callbacks object that will come back from `useMethods`, use the `StateAndCallbacksFor` operator, e.g.:

```ts
const MyContext = React.createContext<StateAndCallbacksFor<typeof methods> | null>(null);
```
