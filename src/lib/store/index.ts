import { configureStore } from "@reduxjs/toolkit";
import { api } from "./api";
import { apiToastMiddleware } from "./apiToastMiddleware";

export const store = configureStore({
  reducer: {
    [api.reducerPath]: api.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(api.middleware, apiToastMiddleware),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
