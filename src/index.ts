import { Draft } from 'immer';
import { useCallback, useMemo } from 'react';
import { useImmerReducer } from 'use-immer';

export type StateAndCallbacksFor<M extends Methods> = [StateFor<M>, CallbacksFor<M>];

export type StateFor<M extends Methods> = M extends Methods<infer S, any> ? S : never;

export type CallbacksFor<M extends Methods> = M extends Methods<any, infer R>
  ? {
      [T in ActionUnion<R>['type']]: (
        ...payload: ActionByType<ActionUnion<R>, T>['payload']
      ) => void
    }
  : never;

export type Methods<S extends object = any, R extends MethodRecordBase<S> = any> = (state: S) => R;

export type MethodRecordBase<S extends object = any> = Record<string, (...args: any[]) => S | void>;

export type ActionUnion<R extends MethodRecordBase> = {
  [T in keyof R]: { type: T; payload: Parameters<R[T]> }
}[keyof R];

export type ActionByType<A, T> = A extends { type: infer T2 } ? (T extends T2 ? A : never) : never;

export default function useMethods<S extends object, R extends MethodRecordBase<S>>(
  methods: Methods<S, R>,
  initialState: S,
): StateAndCallbacksFor<typeof methods> {
  const reducer = useCallback(
    (state: Draft<S>, action: ActionUnion<R>) =>
      methods(state as S)[action.type](...action.payload),
    [methods],
  );
  const [state, dispatch] = useImmerReducer(reducer, initialState);
  const actionTypes: ActionUnion<R>['type'][] = Object.keys(methods(initialState));
  const callbacks = useMemo(
    () =>
      actionTypes.reduce(
        (accum, type) => {
          accum[type] = (...payload) => dispatch({ type, payload } as ActionUnion<R>);
          return accum;
        },
        {} as CallbacksFor<typeof methods>,
      ),
    actionTypes,
  );
  return [state, callbacks];
}
