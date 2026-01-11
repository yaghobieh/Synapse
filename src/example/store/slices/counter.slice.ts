import { createSlice } from '../../../core';

interface CounterState {
  value: number;
  history: number[];
  isLoading: boolean;
}

const initialState: CounterState = {
  value: 0,
  history: [],
  isLoading: false,
};

export const counterSlice = createSlice({
  name: 'counter',
  initialState,
  reducers: {
    increment: (state) => {
      state.value += 1;
      state.history.push(state.value);
    },
    decrement: (state) => {
      state.value -= 1;
      state.history.push(state.value);
    },
    incrementByAmount: (state, action) => {
      state.value += action.payload;
      state.history.push(state.value);
    },
    reset: (state) => {
      state.value = 0;
      state.history = [];
    },
    setLoading: (state, action) => {
      state.isLoading = action.payload;
    },
  },
});

export const {
  increment,
  decrement,
  incrementByAmount,
  reset,
  setLoading
} = counterSlice.actions;

export const counterReducer = counterSlice.reducer;

// Selectors
export const selectCounterValue = (state: { counter: CounterState }) => state.counter.value;
export const selectCounterHistory = (state: { counter: CounterState }) => state.counter.history;
export const selectCounterLoading = (state: { counter: CounterState }) => state.counter.isLoading;
