import { createSlice } from '../../../core';

interface Todo {
  id: number;
  text: string;
  completed: boolean;
  createdAt: number;
}

interface TodosState {
  todos: Todo[];
  filter: 'all' | 'active' | 'completed';
}

const initialState: TodosState = {
  todos: [
    { id: 1, text: 'Learn Synapse', completed: false, createdAt: Date.now() },
    { id: 2, text: 'Build amazing app', completed: false, createdAt: Date.now() },
  ],
  filter: 'all',
};

export const todosSlice = createSlice({
  name: 'todos',
  initialState,
  reducers: {
    addTodo: (state, action) => {
      const newTodo: Todo = {
        id: Date.now(),
        text: action.payload,
        completed: false,
        createdAt: Date.now(),
      };
      state.todos.push(newTodo);
    },
    toggleTodo: (state, action) => {
      const todo = state.todos.find(t => t.id === action.payload);
      if (todo) {
        todo.completed = !todo.completed;
      }
    },
    deleteTodo: (state, action) => {
      state.todos = state.todos.filter(t => t.id !== action.payload);
    },
    editTodo: (state, action) => {
      const { id, text } = action.payload;
      const todo = state.todos.find(t => t.id === id);
      if (todo) {
        todo.text = text;
      }
    },
    setFilter: (state, action) => {
      state.filter = action.payload;
    },
    clearCompleted: (state) => {
      state.todos = state.todos.filter(t => !t.completed);
    },
  },
});

export const {
  addTodo,
  toggleTodo,
  deleteTodo,
  editTodo,
  setFilter,
  clearCompleted
} = todosSlice.actions;

export const todosReducer = todosSlice.reducer;

// Selectors
export const selectTodos = (state: { todos: TodosState }) => state.todos.todos;
export const selectTodosFilter = (state: { todos: TodosState }) => state.todos.filter;
export const selectFilteredTodos = (state: { todos: TodosState }) => {
  const { todos, filter } = state.todos;
  switch (filter) {
    case 'active':
      return todos.filter(todo => !todo.completed);
    case 'completed':
      return todos.filter(todo => todo.completed);
    default:
      return todos;
  }
};
export const selectTodosStats = (state: { todos: TodosState }) => {
  const todos = state.todos.todos;
  const total = todos.length;
  const completed = todos.filter(t => t.completed).length;
  const active = total - completed;
  return { total, completed, active };
};
