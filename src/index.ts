import { useCallback, useMemo } from 'react';
import { useImmerReducer } from 'use-immer';
import { Draft } from 'immer';

export type Methods<
  S extends object = any,
  R extends Record<string, (...args: any[]) => S | void> = any
> = (s: S) => R;

export type StateFor<M extends Methods> = M extends Methods<infer S> ? S : never;

export type ActionUnionFor<M extends Methods> = M extends Methods<any, infer R>
  ? { [T in keyof R]: { type: T; payload: Parameters<R[T]> } }[keyof R]
  : never;

export type CallbacksFor<M extends Methods> = {
  [T in ActionUnionFor<M>['type']]: (
    ...payload: ActionByType<ActionUnionFor<M>, T>['payload']
  ) => void
};

export type ActionByType<A, K> = A extends { type: infer K2 } ? (K extends K2 ? A : never) : never;

export type StateAndCallbacksFor<M extends Methods> = StateFor<M> & CallbacksFor<M>;

export default function useStateMethods<M extends Methods>(
  initialState: StateFor<M>,
  methods: M,
): StateAndCallbacksFor<M> {
  const reducer = useCallback(
    (state: Draft<StateFor<M>>, action: ActionUnionFor<M>) =>
      methods(state)[action.type](...action.payload),
    [methods],
  );
  const [state, dispatch] = useImmerReducer(reducer, initialState);
  const actionTypes: ActionUnionFor<M>['type'][] = Object.keys(methods(initialState));
  const callbacks = useMemo(
    () =>
      actionTypes.reduce(
        (accum, type) => {
          accum[type] = (...payload) => dispatch({ type, payload } as ActionUnionFor<M>);
          return accum;
        },
        {} as CallbacksFor<M>,
      ),
    actionTypes,
  );
  return { ...state, ...callbacks };
}
