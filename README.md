# 🐼 Zustate

**A client-first Zustand data abstraction that enforces high-level, well-reasoned structures, interfaces and conventions.**

## Basic Example

```tsx
import { create, Store } from "zustore";
const FILTER_OPTIONS = ["all", "completed", "active"] as const;

type Task = {
  id: string;
  title: string;
  completed: boolean;
  updated: number;
};

type State = {
  values: {
    filter: (typeof FILTER_OPTIONS)[number];
  };
  collections: {
    tasks: Task[];
  };
};

const data = create<State>({
  initial: {
    values: {
      filter: "all",
    },
    collections: {
      tasks: [],
    },
  },
});

export const App = () => {
  const filter = data.values.filter.useSubscribe();

  const tasks = data.collections.tasks.useGet((inner) => {
    if (filter === "all") return true;
    if (filter === "completed") return inner.completed;
    return !inner.completed;
  });

  return (
    <div>
      <form onSubmit={(event) => {
        const title = new FormData(event.target).get('title')

        data.collections.tasks.add({
          title,
          completed: false,
        })
      }}>
        <label>
          <span>Add a task</span>
          <input type="text" name="title" >
        </label>
      </form>

      <select>
        {FILTER_OPTIONS.map((value) => (
          <option
            key={value}
            selected={filter === value}
            onClick={() => data.values.filter.set(value)}
          >
            {value}
          </option>
        ))}
      </select>

      <ul>
        {tasks.map(({ id, completed, title }) => (
          <li key={id}>
            <input
              type="checkbox"
              checked={completed}
              onChange={() =>
                data.collections.tasks.set({
                  id: id,
                  completed: !completed,
                })
              }
            />

            <span>{title}</span>
          </li>
        ))}
      </ul>
    </div>
  );
};
```
