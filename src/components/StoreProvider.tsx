"use client";

import { Provider } from "react-redux";
import { store } from "@/lib/store";
import SessionWrapper from "./SessionWrapper";

export default function StoreProvider({ children }: Readonly<{ children: React.ReactNode }>) {
  // return <SessionWrapper><Provider store={store}>{children}</Provider></SessionWrapper>;
  return <Provider store={store}>{children}</Provider>;
}
