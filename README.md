# `use-methods` [![Build Status](https://travis-ci.com/pelotom/use-methods.svg?branch=master)](https://travis-ci.com/pelotom/use-methods)

<img src="https://i.imgur.com/2GzRGBU.png" width="350">

## Installation

Pick your poison:
- ```
  npm install use-methods
  ```
- ```
  yarn add use-methods
  ```

## Usage

This library exports a single [React Hook](https://reactjs.org/docs/hooks-intro.html), `useMethods`, which has all the power of [`useReducer`](https://reactjs.org/docs/hooks-reference.html#usereducer) but none of the ceremony that comes with actions and dispatchers. The basic API follows a similar pattern to `useReducer`:

```js
const [state, callbacks] = useMethods(methods, initialState);
```

Instead of providing a single "reducer" function which is one giant switch statement over an action type, you provide a set of "methods" which modify the state or return new states. Likewise, what you get back in addition to the latest state is not a single `dispatch` function but a set of callbacks corresponding to your methods.

A full example:

```js
import useMethods from 'use-methods';

function Counter() {

  const [
    { count }, // <- latest state
    { reset, increment, decrement }, // <- callbacks for modifying state
  ] = useMethods(methods, initialState);

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

### Comparison to `useReducer`

[Here's a more complex example](https://codesandbox.io/s/2109324q3r) involving a list of counters, implemented using `useReducer` and `useMethods` respectively:

![useReducer vs useMethods comparison](https://i.imgur.com/CayVD72.png)

_Which of these would you rather write?_

## Immutability

`use-methods` is built on [`immer`](https://github.com/mweststrate/immer), which allows you to write your methods in an imperative, mutating style, even though the actual state managed behind the scenes is immutable. You can also return entirely new states from your methods where it's more convenient to do so (as in the `reset` example above).

## Memoization

Like the `dispatch` method returned from `useReducer`, the callbacks returned from `useMethods` aren't recreated on each render, so they will not be the cause of needless re-rendering if passed as bare props to `React.memo`ized subcomponents. Save your `useCallback`s for functions that don't map exactly to an existing callback! Also, the whole `callbacks` object is also memoized (as in `[state, callbacks]`), so you can safely add this to your deps array as well, and there's no need to pass individual methods

```ts
const [state, callbacks] = useMethods(methods, initialState);

// can pass to event handlers props, useEffect, etc
const MyStableCallback = useCallback((times: number) => {  
  return callbacks.someMethod('a', times);
}, [callbacks]);

// they are equivalent
const MyOtherStableCallback = useCallback((times: number) => {
  return callbacks.someMethod('a', times);
}, [callbacks.someMethod]);
```

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
