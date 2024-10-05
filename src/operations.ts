/*
 * The principle behind the `collections` helpers is that if there are certain
 * constraints placed on the way that lists of data are modeled in the app, then
 * it is easier to perform/reason about general CRUD methods on the list.
 *
 * For something to qualify as a "collection" it requires the following to be
 * true:
 *
 * - Should be a homogeneous array of objects, meaning that all objects in the
 *   area should have the same type/shape.
 *
 * - All objects should have a unique string identifier assigned to an `id`
 *   property.
 *
 * - All objects should have a number assigned to an `updated` property, which
 *   represents a epoch timestamp (e.g. the result of calling `Date.now()` or
 *   `.getTime()` on an existing date). This value is automatically updated
 *   every time the object is modified (or created) by one of the `collection`
 *   methods.
 *
 * - Objects are only allowed to have primitive values (string, number, boolean,
 *   null, etc.) assigned to their keys. The only exception is arrays, however
 *   the arrays themselves are only allowed to contain primitives.
 *
 * Note that the constrains of primitives means that no nested objects are
 * allowed inside the actual collection objects themselves. This means that if
 * you want to group data in logical sections (especially of the objects
 * themselves get too big), then it is recommended that you split the data into
 * two or more separate collections that simply share the same ID value.
 *
 * If this is done it is recommended that you create an abstraction over these
 * lists that manages the relationships between the lists automatically when
 * updating/retrieving data. The latter is similar to how the same would be done
 * with multiple tables in a relational database, by using foreign keys and/or
 * JOIN operations.
 */

import { v4 as createId } from "uuid";

export type Value = string | number | boolean | null;

export type BaseItem = {
  [Key: string]: Value;
  id: string;
  updated: number;
};

export type Aggregate<Item extends BaseItem> = (
  operation: string | ((item: Item) => string)
) => Record<string, number>;

/**
 * A method that maps over a specific key in all objects inside the list, and
 * returns all the different variations of values present in that specific
 * property as well as the count of how many times the value is repeated in the
 * list.
 *
 * Generally the property name should be passed as a string, however an function
 * can also be passed that calculates a derived value (accepting the whole
 * object as an argument) to be used instead.
 *
 * Note that if the value is a boolean or number then it will be coerced into a
 * string.
 */
export const createAggregate =
  <Item extends BaseItem>(inner: () => Item[]): Aggregate<Item> =>
  (operation) => {
    const array = inner();
    const result: Record<string, number> = {};

    array.forEach((value) => {
      const inner =
        typeof operation === "function" ? operation(value) : value[operation];

      const innerAsString = String(inner);
      const current = result[innerAsString] || 0;
      result[innerAsString] = current + 1;
    });

    return result;
  };

type Predicate<Item extends BaseItem> = (item: Item) => boolean;

type Match<Item extends BaseItem> = {
  [Key in keyof Item]: Value | Value[];
};

/**
 *
 */
export type Get<Item extends BaseItem> = {
  (operation: null, count?: undefined, assert?: undefined): null;
  (
    operation: string | Predicate<Item> | Match<Item>,
    count: 1,
    assert: true
  ): Item;
  (
    operation: string[] | Predicate<Item> | Match<Item>,
    count: number,
    assert: true
  ): Item[];
  (
    operation: string | Predicate<Item> | Match<Item>,
    count?: 1,
    assert?: false | undefined
  ): Item | null;
  (
    operation: string[] | Predicate<Item> | Match<Item>,
    count: number,
    assert?: boolean
  ): Item[];
  (
    operation: string[] | Predicate<Item> | Match<Item>,
    count?: number,
    assert?: boolean
  ): Item[];
};

const createIterator = (operation: any) => {
  if (typeof operation === "function") return operation;

  if (Array.isArray(operation)) {
    return (inner: any) => operation.includes(inner.id);
  }

  const entries = Object.entries(operation);

  return (inner: any) =>
    entries.every(([key, value]) => {
      if (Array.isArray(value)) return value.includes(inner[key]);
      return inner[key] === value;
    });
};

/**
 * Retrieves a single object from the list. Accepts either a string ID value or
 * a predicate function that resolves to `true` on match. Note that an error
 * will be thrown if no match is found, for a version that rather falls back to
 * `null` use `getNullable`.
 */
export const createGet = <Item extends BaseItem>(inner: () => Item[]) => {
  const result = (operation: unknown, count = 0, assert: unknown) => {
    if (operation === null) return null;
    const list = inner();

    if (
      typeof operation === "string" &&
      typeof count === "number" &&
      count > 1
    ) {
      throw new Error("Cannot use ID with count");
    }

    if (typeof operation === "string") {
      const result = list.find((item) => item.id === operation);
      if (assert && !result) throw new Error("Item not found");
      return result || null;
    }

    if (typeof operation !== "function") {
    }

    const iterator = createIterator(operation);
    let result: Item[] = [];

    for (const item of list) {
      if (count !== 0 && result.length >= count) break;
      if (!iterator(item)) continue;
      result.push(item);
    }

    if (count && assert && result.length !== count) {
      throw new Error("Could not find all items");
    }

    return result;
  };

  return result as Get<Item>;
};

/**
 * ...
 */
export const createAdd = <Item extends BaseItem>(array: () => Item[]) => {
  return (
    items: (Omit<Item, "id" | "updated"> & { id?: string; updated?: number })[],
    position?: "start" | "end"
  ): Item[] => {
    const addition = items.map(
      (inner) =>
        ({
          ...inner,
          id: inner.id || createId(),
          updated: inner.updated || Date.now(),
        } as Item)
    );

    const result: Item[] = [
      ...(position === "start" ? addition : []),
      ...array(),
      ...(position !== "start" ? addition : []),
    ];

    return result;
  };
};

/**
 * A
 */
export const createRemove = <Item extends BaseItem>(array: () => Item[]) => {
  const source = array();

  return (items: Item[] | string[]): Item[] => {
    const stringArray =
      typeof items[0] === "string"
        ? (items as string[])
        : (items as Item[]).map((item) => item.id);

    const result: Item[] = source.filter((item) => {
      if (stringArray.includes(item.id)) return false;
      return true;
    });

    return result;
  };
};

/**
 * A
 */
export const createSet = <Item extends BaseItem>(array: () => Item[]) => {
  return (
    items: (Partial<Omit<Item, "id">> & { id: string })[],
    strict?: boolean
  ): Item[] => {
    let stringArray = items.map((item) => item.id);

    const result = array().map((current) => {
      if (!stringArray.includes(current.id)) return current;
      stringArray = stringArray.filter((id) => id !== current.id);

      const newItem = {
        ...current,
        ...items.find((item) => item.id === current.id),
        updated: Date.now(),
      } as Item;

      return newItem;
    });

    if (strict && stringArray.length) {
      throw new Error(`Item with id ${stringArray[0]} not found`);
    }

    return result;
  };
};
