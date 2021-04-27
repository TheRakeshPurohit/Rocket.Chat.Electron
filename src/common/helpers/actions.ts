/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/ban-types */

export type FluxStandardAction<
  Type extends string = string,
  Payload = void
> = void extends Payload
  ? {
      type: Type;
    }
  : {
      type: Type;
      payload: Payload;
    };

export const hasMeta = <Action extends FluxStandardAction<string, unknown>>(
  action: Action
): action is Action & { meta: Record<string, unknown> } =>
  'meta' in action &&
  typeof (action as Action & { meta: unknown }).meta === 'object' &&
  (action as Action & { meta: unknown }).meta !== null;

export const isResponse = <Action extends FluxStandardAction<string, unknown>>(
  action: Action
): action is Action & { meta: { response: boolean; id: unknown } } =>
  hasMeta(action) &&
  (action as Action & { meta: { response: unknown; id: unknown } }).meta
    .response === true;

export const isErrored = <Action extends FluxStandardAction<string, unknown>>(
  action: Action
): action is Action & { error: true; payload: Error } =>
  'meta' in action &&
  (action as Action & { error: unknown }).error === true &&
  (action as Action & { payload: unknown }).payload instanceof Error;

export const hasPayload = <Action extends FluxStandardAction<string, unknown>>(
  action: Action
): action is Action & {
  payload: Action extends { payload: infer P } ? P : never;
} => 'payload' in action;

export const isResponseTo = <
  Action extends FluxStandardAction<string, unknown>,
  Types extends [...string[]]
>(
  id: unknown,
  ...types: Types
) => (
  action: Action
): action is Action &
  {
    [Type in Types[number]]: {
      type: Type;
      meta: { response: boolean; id: unknown };
    };
  }[Types[number]] =>
  isResponse(action) && types.includes(action.type) && action.meta.id === id;