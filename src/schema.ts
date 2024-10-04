import { StoreApi } from "zustand";

export type Value = string | number | boolean | null;

export type BaseItem = {
  [Key: string]: Value;
  id: string;
  updated: number;
};

export type Predicate<Item extends BaseItem> = (item: Item) => boolean;

export type BaseStore = {
  values: Record<string, Value>;
  collections: Record<string, BaseItem[]>;
};

export type Values<Store extends BaseStore> = {
  [Key in keyof Store["values"]]: {
    get: {
      (assert: true): NonNullable<Store["values"][Key]>;
      (assert?: false): Store["values"][Key];
    };

    set: (
      value:
        | Store["values"][Key]
        | ((current: Store["values"][Key]) => Store["values"][Key])
    ) => void;

    useSubscribe: {
      (assert: true): NonNullable<Store["values"][Key]>;
      (assert?: false): Store["values"][Key];
    };
  };
};

/**
 *
 */
export type Get<Item extends BaseItem> = {
  (operation: string | Predicate<Item>, count: 1, assert: true): Item;
  (operation: string[] | Predicate<Item>, count: number, assert: true): Item[];
  (
    operation: string | Predicate<Item>,
    count?: 1,
    assert?: false | undefined
  ): Item | null;
  (
    operation: string[] | Predicate<Item>,
    count: number,
    assert?: boolean
  ): Item[];
  (
    operation: string[] | Predicate<Item>,
    count?: number,
    assert?: boolean
  ): Item[];
};

export type Remove = (
  items: string | string[] | { id: string } | { id: string }[]
) => void;

export type Set<Item extends BaseItem> = (
  items:
    | (Partial<Omit<Item, "id">> & { id: string })
    | (Partial<Omit<Item, "id">> & { id: string }[]),
  strict?: boolean
) => Item[];

export type Add<Item extends BaseItem> = (
  items: (Omit<Item, "id" | "updated"> & { id?: string; updated?: number })[],
  position?: "start" | "end"
) => Item[];

export type Aggregate<Item extends BaseItem> = (
  operation: string | ((item: Item) => string)
) => Record<string, number>;

export type Collections<Store extends BaseStore> = {
  [Key in keyof Store["collections"]]: {
    get: Get<Store["collections"][Key][number]>;
    set: Set<Store["collections"][Key][number]>;
    remove: Remove;
    add: Add<Store["collections"][Key][number]>;
    aggregate: Aggregate<Store["collections"][Key][number]>;
    useGet: Get<Store["collections"][Key][number]>;
    useAggregate: Aggregate<Store["collections"][Key][number]>;
  };
};

export type Data<Store extends BaseStore> = {
  store: StoreApi<Store>;
  values: Values<Store>;
  collections: Collections<Store>;
};
