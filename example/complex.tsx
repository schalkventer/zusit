import { create, Store } from "../dist";

type Users = {
  id: string;
  updated: number;
  name: string;
  active: boolean;
};

type Task = {
  id: string;
  projectId: Project["id"];
  assigned: Users["id"];
  updated: number;
  name: string;
};

type SubTask = {
  id: string;
  task: Task["id"];
  completed: boolean;
  updated: number;
};

type Project = {
  id: string;
  updated: number;
  name: string;
};

type State = {
  values: {
    ready: boolean;
    user: string | null;
    project: string | null;
    task: string | null;
  };
  collections: {
    users: Users[];
    tasks: Task[];
    subTasks: SubTask[];
    projects: Project[];
  };
};

const LOCAL_STORAGE_KEY = "6ce6bfd0-739b-4ecb-a8d9-6e8ea1551adc";

const services = {
  set: async (serialized: string) => {
    localStorage.setItem(LOCAL_STORAGE_KEY, serialized);
  },
  get: async (): Promise<string | null> => {
    const serialized = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!serialized) return null;
    return serialized;
  },
};

const data = create<State>({
  initial: {
    values: {
      ready: false,
      user: null,
      project: null,
      task: null,
    },
    collections: {
      users: [],
      tasks: [],
      subTasks: [],
      projects: [],
    },
  },
  push: async () => {},
  pull: async () => {},
});

export const Auth = () => {
  const user = data.values.user.useSubscribe();
  // const users = data.collections.users.get({ active: [true] });
  if (user) return null;

  return;
};

export const App = () => {
  const ready = data.values.ready.useSubscribe();
  const user = data.values.user.useSubscribe();
  const project = data.values.project.useSubscribe();

  // if (!ready) return <div>Loading...</div>;

  // if (!user) {
  //   return <div>Choose a user</div>;
  // }
};
