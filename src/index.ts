import produce from 'immer';
import { Reducer, useMemo, useReducer } from 'react';

export type StateAndCallbacksFor<M extends Methods> = [StateFor<M>, CallbacksFor<M>];

export type StateFor<M extends Methods> = M extends Methods<infer S, any> ? S : never;

export type CallbacksFor<M extends Methods> = M extends Methods<any, infer R>
  ? {
      [T in ActionUnion<R>['type']]: (
        ...payload: ActionByType<ActionUnion<R>, T>['payload']
      ) => void
    }
  : never;

export type Methods<S = any, R extends MethodRecordBase<S> = any> = (state: S) => R;

export type MethodRecordBase<S = any> = Record<
  string,
  (...args: any[]) => S extends object ? S | void : S
>;

export type ActionUnion<R extends MethodRecordBase> = {
  [T in keyof R]: { type: T; payload: Parameters<R[T]> }
}[keyof R];

export type ActionByType<A, T> = A extends { type: infer T2 } ? (T extends T2 ? A : never) : never;

export default function useMethods<S, R extends MethodRecordBase<S>>(
  methods: Methods<S, R>,
  initialState: S,
): StateAndCallbacksFor<typeof methods>;
export default function useMethods<S, R extends MethodRecordBase<S>, I>(
  methods: Methods<S, R>,
  initializerArg: I,
  initializer: (arg: I) => S,
): StateAndCallbacksFor<typeof methods>;
export default function useMethods<S, R extends MethodRecordBase<S>, I = S>(
  methods: Methods<S, R>,
  initialState: any,
  initializer?: any,
): StateAndCallbacksFor<typeof methods> {
  const reducer = useMemo<Reducer<S, ActionUnion<R>>>(
    () =>
      (produce as any)((state: S, action: ActionUnion<R>) =>
        methods(state)[action.type](...action.payload),
      ),
    [methods],
  );
  const [state, dispatch] = useReducer(reducer, initialState, initializer);
  const actionTypes: ActionUnion<R>['type'][] = Object.keys(methods(state));
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
