import { useCallback, useMemo } from 'react';
import { useImmerReducer } from 'use-immer';
import { Draft } from 'immer';

export type Transitions<
  S extends object = any,
  R extends Record<string, (...args: any[]) => S | void> = any
> = (s: S) => R;

export type StateFor<T extends Transitions> = T extends Transitions<infer S> ? S : never;

export type ActionUnionFor<T extends Transitions> = T extends Transitions<any, infer R>
  ? { [T in keyof R]: { type: T; payload: Parameters<R[T]> } }[keyof R]
  : never;

export type CallbacksFor<T extends Transitions> = {
  [K in ActionUnionFor<T>['type']]: (
    ...payload: ActionByType<ActionUnionFor<T>, K>['payload']
  ) => void
};

export type ActionByType<A, K> = A extends { type: infer K2 } ? (K extends K2 ? A : never) : never;

export default function useStateMethods<T extends Transitions>(
  initialState: StateFor<T>,
  transitions: T,
): StateFor<T> & CallbacksFor<T> {
  const reducer = useCallback(
    (state: Draft<StateFor<T>>, action: ActionUnionFor<T>) =>
      transitions(state)[action.type](...action.payload),
    [transitions],
  );
  const [state, dispatch] = useImmerReducer(reducer, initialState);
  const actionTypes: ActionUnionFor<T>['type'][] = Object.keys(transitions(initialState));
  const callbacks = useMemo(
    () =>
      actionTypes.reduce(
        (accum, type) => {
          accum[type] = (...payload) => dispatch({ type, payload } as ActionUnionFor<T>);
          return accum;
        },
        {} as CallbacksFor<T>,
      ),
    actionTypes,
  );
  return { ...state, ...callbacks };
}
