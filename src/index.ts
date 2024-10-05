import { createStore, useStore } from "zustand";
import { getObjectDiff, ObjectDiff } from "@donedeal0/superdiff";
import { StoreApi } from "zustand";

import {
  createAdd,
  createAggregate,
  createGet,
  createRemove,
  createSet,
  BaseItem,
  Value,
  Aggregate,
  Get,
} from "./operations";

type BaseState = {
  values: Record<string, Value>;
  collections: Record<string, BaseItem[]>;
};

type Values<State extends BaseState> = {
  [Key in keyof State["values"]]: {
    get: {
      (assert: true): NonNullable<State["values"][Key]>;
      (assert?: false): State["values"][Key];
    };

    set: (
      value:
        | State["values"][Key]
        | ((current: State["values"][Key]) => State["values"][Key])
    ) => void;

    useGet: {
      (assert: true): NonNullable<State["values"][Key]>;
      (assert?: false): State["values"][Key];
    };
  };
};

type Remove = (
  items: string | string[] | { id: string } | { id: string }[]
) => void;

type Set<Item extends BaseItem> = (
  items:
    | (Partial<Omit<Item, "id">> & { id: string })
    | (Partial<Omit<Item, "id">> & { id: string }[]),
  strict?: boolean
) => Item[];

type Add<Item extends BaseItem> = (
  items: (Omit<Item, "id" | "updated"> & { id?: string; updated?: number })[],
  position?: "start" | "end"
) => Item[];

type Collections<State extends BaseState> = {
  [Key in keyof State["collections"]]: {
    get: Get<State["collections"][Key][number]>;
    getAll: () => State["collections"][Key];
    set: Set<State["collections"][Key][number]>;
    remove: Remove;
    add: Add<State["collections"][Key][number]>;
    aggregate: Aggregate<State["collections"][Key][number]>;
    useGet: Get<State["collections"][Key][number]>;
    useAggregate: Aggregate<State["collections"][Key][number]>;
  };
};

export type Store<State extends BaseState> = {
  internal: StoreApi<State>;
  values: Values<State>;
  collections: Collections<State>;
};

export type Config<State extends BaseState> = {
  initial: State;

  push?: (props: {
    store: Store<State>;
    getDiff: () => ObjectDiff;
  }) => void | Promise<void>;

  pull?: (props: {
    store: Store<State>;
    calcDiff: (newData: {
      values?: Partial<State["values"]>;
      collections?: Partial<State["collections"]>;
    }) => ObjectDiff;
  }) => Promise<void>;
};

export const create = <State extends BaseState>(
  props: Config<State>
): Store<State> => {
  const { initial } = props;
  const createTypedStore = createStore<State>();
  const internal = createTypedStore(() => initial);

  const values: Values<State> = Object.keys(initial.values).reduce(
    (acc, key) => {
      return {
        ...acc,
        [key]: {
          get: (assert?: boolean) => {
            const inner = internal.getState().values[key];

            if ((assert && inner === null) || inner === undefined) {
              throw new Error("Value is required");
            }

            return inner;
          },

          set: (newValue: unknown) => {
            return internal.setState((prev) => ({
              ...prev,
              values: {
                ...prev.values,
                [key]:
                  typeof newValue === "function"
                    ? newValue(prev.values[key])
                    : newValue,
              },
            }));
          },

          useGet: (assert?: boolean) => {
            const inner = useStore(internal, (state) => state.values[key]);

            if ((assert && inner === null) || inner === undefined) {
              throw new Error("Value required");
            }

            return inner;
          },
        },
      };
    },
    {} as Values<State>
  );

  const collections: Collections<State> = Object.keys(initial.values).reduce(
    (acc, key) => {
      const inner = () => internal.getState().collections[key];
      const get = createGet(inner);
      const aggregate = createAggregate(inner);
      const remove = createRemove(inner);
      const add = createAdd(inner);
      const set = createSet(inner);

      const useGet = (operation: any, count = 0, assert: any) => {
        const value = useStore(internal, (state) => state.collections[key]);
        const innerGet = createGet(() => value);
        return innerGet(operation, count, assert);
      };

      const useAggregate = (operation: any, count = 0, assert: any) => {
        const value = useStore(internal, (state) => state.collections[key]);
        const innerGet = createGet(() => value);
        return innerGet(operation, count, assert);
      };

      const getAll = () => inner();

      return {
        ...acc,
        [key]: {
          get,
          getAll,
          aggregate,
          useGet,
          useAggregate,
          remove,
          add,
          set,
        },
      };
    },
    {} as Collections<State>
  );

  const store: Store<State> = {
    internal,
    values,
    collections,
  };

  if (props.push) {
    internal.subscribe((newState, prevState) => {
      props.push!({
        store,
        getDiff: () => getObjectDiff(prevState, newState),
      });
    });
  }

  if (props.pull) {
    props.pull({
      store,
      calcDiff: (newData) => {
        return getObjectDiff(internal.getState(), newData);
      },
    });
  }

  return store;
};

const zustate = {
  create,
};

export default zustate;
