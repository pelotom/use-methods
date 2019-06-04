import produce, { PatchListener } from 'immer';
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

export type MethodsFn<S = any, R extends MethodRecordBase<S> = any> = (state: S) => R;

export type MethodsObject<S = any, R extends MethodRecordBase<S> = any> = {
  methods: MethodsFn<S, R>;
  patchCallback?: PatchListener;
};

export type Methods<S = any, R extends MethodRecordBase<S> = any> =
  | MethodsFn<S, R>
  | MethodsObject<S, R>;

function isMethodsFn<S = any, R extends MethodRecordBase<S> = any>(
  methods: Methods<S, R>,
): methods is MethodsFn<S, R> {
  return typeof methods === 'function';
}
function isMethodsObject<S = any, R extends MethodRecordBase<S> = any>(
  methods: Methods<S, R>,
): methods is MethodsObject<S, R> {
  return typeof methods === 'object';
}

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
): StateAndCallbacksFor<Methods<S, R>>;
export default function useMethods<S, R extends MethodRecordBase<S>, I>(
  methods: Methods<S, R>,
  initializerArg: I,
  initializer: (arg: I) => S,
): StateAndCallbacksFor<Methods<S, R>>;
export default function useMethods<S, R extends MethodRecordBase<S>>(
  methods: Methods<S, R>,
  initialState: any,
  initializer?: any,
): StateAndCallbacksFor<Methods<S, R>> {
  const [reducer, methodsFn] = useMemo<[Reducer<S, ActionUnion<R>>, MethodsFn<S, R>]>(() => {
    if (isMethodsFn(methods)) {
      return [
        (state: S, action: ActionUnion<R>) => {
          return (produce as any)(state, (draft: S) => {
            return methods(draft)[action.type](...action.payload);
          });
        },
        methods,
      ];
    }

    if (isMethodsObject(methods)) {
      const { methods: methodsFn, patchCallback } = methods;
      return [
        (state: S, action: ActionUnion<R>) => {
          return (produce as any)(
            state,
            (draft: S) => {
              return methodsFn(draft)[action.type](...action.payload);
            },
            patchCallback,
          );
        },
        methodsFn,
      ];
    }

    throw new Error('Invalid methods argument.');
  }, [methods]);
  const [state, dispatch] = useReducer(reducer, initialState, initializer);
  const actionTypes: ActionUnion<R>['type'][] = Object.keys(methodsFn(state));
  const callbacks = useMemo(
    () =>
      actionTypes.reduce(
        (accum, type) => {
          accum[type] = (...payload) => dispatch({ type, payload } as ActionUnion<R>);
          return accum;
        },
        {} as CallbacksFor<typeof methodsFn>,
      ),
    actionTypes,
  );
  return [state, callbacks];
}
