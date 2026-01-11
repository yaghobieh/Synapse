import { createSlice, createApiAction } from '../../../core';

interface User {
  id: number;
  name: string;
  email: string;
  username: string;
}

interface UsersState {
  users: User[];
  loading: boolean;
  error: string | null;
  selectedUser: User | null;
}

const initialState: UsersState = {
  users: [],
  loading: false,
  error: null,
  selectedUser: null,
};

export const usersSlice = createSlice({
  name: 'users',
  initialState,
  reducers: {
    setLoading: (state, action) => {
      state.loading = action.payload;
    },
    setUsers: (state, action) => {
      state.users = action.payload;
      state.loading = false;
      state.error = null;
    },
    setSelectedUser: (state, action) => {
      state.selectedUser = action.payload;
    },
    setError: (state, action) => {
      state.error = action.payload;
      state.loading = false;
    },
    addUser: (state, action) => {
      state.users.push(action.payload);
    },
    updateUser: (state, action) => {
      const { id, ...updates } = action.payload;
      const index = state.users.findIndex(user => user.id === id);
      if (index !== -1) {
        state.users[index] = { ...state.users[index], ...updates };
      }
    },
    deleteUser: (state, action) => {
      state.users = state.users.filter(user => user.id !== action.payload);
    },
  },
});

export const {
  setLoading,
  setUsers,
  setSelectedUser,
  setError,
  addUser,
  updateUser,
  deleteUser
} = usersSlice.actions;

export const usersReducer = usersSlice.reducer;

// API Actions
export const fetchUsers = createApiAction(
  'users/fetchUsers',
  { url: '/users', method: 'GET' }
);

export const fetchUserById = (id: number) => createApiAction(
  'users/fetchUserById',
  { url: `/users/${id}`, method: 'GET' }
);

export const createUser = (userData: Omit<User, 'id'>) => createApiAction(
  'users/createUser',
  { url: '/users', method: 'POST', data: userData }
);

export const updateUserApi = (id: number, userData: Partial<User>) => createApiAction(
  'users/updateUser',
  { url: `/users/${id}`, method: 'PUT', data: userData }
);

export const deleteUserApi = (id: number) => createApiAction(
  'users/deleteUser',
  { url: `/users/${id}`, method: 'DELETE' }
);

// Selectors
export const selectUsers = (state: { users: UsersState }) => state.users.users;
export const selectUsersLoading = (state: { users: UsersState }) => state.users.loading;
export const selectUsersError = (state: { users: UsersState }) => state.users.error;
export const selectSelectedUser = (state: { users: UsersState }) => state.users.selectedUser;
