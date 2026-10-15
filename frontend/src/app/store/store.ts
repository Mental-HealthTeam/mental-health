import { configureStore } from '@reduxjs/toolkit';
import aiChatReducer from './slices/aiChatSlice';

export const store = configureStore({
  reducer: {
    aiChat: aiChatReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;