import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { api } from "@/shared/lib/api";
import type { Me } from "@/shared/types";

export const meQuery = queryOptions({
  queryKey: ["me"],
  queryFn: () => api<Me>("/me"),
  staleTime: 30_000,
  retry: false,
});

/** Người dùng hiện tại. Chỉ dùng bên trong các route đã qua auth guard. */
export function useMe(): Me {
  return useSuspenseQuery(meQuery).data;
}

export function login(email: string, password: string) {
  return api<Me>("/auth/login", { method: "POST", json: { email, password } });
}

export function logout() {
  return api<void>("/auth/logout", { method: "POST" });
}

export function changePassword(newPassword: string) {
  return api<Me>("/auth/change-password", { method: "POST", json: { newPassword } });
}
