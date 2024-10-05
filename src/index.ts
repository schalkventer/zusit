import { createStore, useStore } from "zustand";
import * as schema from "./schema";
import * as operations from "./operations";

export const create = <Store extends schema.BaseStore>(props: {
  initial: Store;
}): schema.Data<Store> => {
  const { initial } = props;
  const createTypedStore = createStore<Store>();
  const store = createTypedStore(() => initial);

  const values: schema.Values<Store> = Object.keys(initial.values).reduce(
    (acc, key) => {
      return {
        ...acc,
        [key]: {
          get: (assert?: boolean) => {
            const inner = store.getState().values[key];

            if ((assert && inner === null) || inner === undefined) {
              throw new Error("Value is required");
            }

            return inner;
          },

          set: (newValue: unknown) => {
            return store.setState((prev) => ({
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

          useValue: (assert?: boolean) => {
            const inner = useStore(store, (state) => state.values[key]);

            if ((assert && inner === null) || inner === undefined) {
              throw new Error("Value required");
            }

            return inner;
          },
        },
      };
    },
    {} as schema.Values<Store>
  );

  const collections: schema.Collections<Store> = Object.keys(
    initial.values
  ).reduce((acc, key) => {
    const inner = () => store.getState().collections[key];
    const get = operations.createGet(inner);
    const aggregate = operations.createAggregate(inner);
    const remove = operations.createRemove(inner);
    const add = operations.createAdd(inner);
    const set = operations.createSet(inner);

    const useGet = (operation: any, count = 0, assert: any) => {
      const value = useStore(store, (state) => state.collections[key]);
      const innerGet = operations.createGet(() => value);
      return innerGet(operation, count, assert);
    };

    const useAggregate = (operation: any, count = 0, assert: any) => {
      const value = useStore(store, (state) => state.collections[key]);
      const innerGet = operations.createGet(() => value);
      return innerGet(operation, count, assert);
    };

    return {
      ...acc,
      [key]: {
        get,
        aggregate,
        useGet,
        useAggregate,
        remove,
        add,
        set,
      },
    };
  }, {} as schema.Collections<Store>);

  return {
    store,
    values,
    collections,
  };
};

const zustate = {
  create,
};

export type { Data as Instance } from "./schema";

export default zustate;
