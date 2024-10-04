# 🐼 Zustate

## API

```ts
import { StoreApi } from "zustand";

/**
 *
 */
type Value = string | number | boolean;

/**
 * The basic shape that is required by all items a collection.
 */
export type BaseItem = {
  [K: string]: Value;
  id: string;
  updated: number;
  synced: number;
};

/**
 *
 */
export type BaseState = {
  values: Record<string, Value>;
  collections: Record<string, BaseItem[]>;
};

export type ValueOperations<V extends Record<string, Value>> = {
  [Property in keyof V]: {
    get: <A extends boolean | undefined = undefined>(
      assert?: A
    ) => A extends true ? NonNullable<V[Property]> : V[Property];

    set: (
      newValue: V[Property] | ((current: V[Property]) => V[Property])
    ) => void;

    useSubscribe: <A extends boolean | undefined = undefined>(
      assert?: A
    ) => A extends true ? NonNullable<V[Property]> : V[Property];
  };
};

/**
 *
 */
export type CollectionOperations<T extends BaseItem> = {
  getAll: () => T[];

  get: (operation: string | string[], assert?: boolean) => T;

  find: (
    count: number,
    operation: (item: T) => boolean,
    assert?: boolean
  ) => T[];

  remove: (items: T[] | string[]) => T[];

  set: (
    items: (Partial<Omit<T, "id">> & { id: string })[],
    assert?: boolean
  ) => T[];

  add: (
    items: (Omit<T, "id" | "updated"> & { id?: string; updated?: number })[],
    position?: "start" | "end"
  ) => T[];

  aggregate: (
    operation: string | string[] | ((item: T) => string | string[])
  ) => Record<string, number>;

  useGetAll: () => T[];
  useGet: (operation: string | string[], assert?: boolean) => T;

  useFind: (
    count: number,
    operation: (item: T) => boolean,
    assert?: boolean
  ) => T[];
};

export type Config<S extends BaseState> = {
  initial: S;
  pull: (current: S) => Promise<S>;
  push: (prev: S, next: S) => Promise<void>;
};

export type Module<State extends BaseState> = {
  _internals: {
    store: StoreApi<State>;
  };
  values: ValueOperations<State["values"]>;
  collections: {
    [Key in keyof State["collections"]]: CollectionOperations<
      State["collections"][Key][number]
    >;
  };
};

```
