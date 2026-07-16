import { isRejectedWithValue, isFulfilled, Middleware } from "@reduxjs/toolkit";
import { toast } from "sonner";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const apiToastMiddleware: Middleware = () => (next) => (action: any) => {
  if (isFulfilled(action)) {
    const data = action.payload as { message?: string } | undefined;
    toast.success(data?.message || "Operation successful");
  }

  if (isRejectedWithValue(action)) {
    const payload = action.payload as { data?: { message?: string }; status?: number } | undefined;
    toast.error(payload?.data?.message || "Something went wrong");
  }

  return next(action);
};
