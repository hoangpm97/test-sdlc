import "./styles/app.css";
import { QueryClientProvider } from "@tanstack/react-query";
import { RouterProvider } from "@tanstack/react-router";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { queryClient } from "./app/queryClient";
import { router } from "./app/router";
import { setUnauthorizedHandler } from "./shared/lib/api";

// Phiên hết hạn → xóa cache người dùng và quay về trang đăng nhập
setUnauthorizedHandler(() => {
  queryClient.removeQueries({ queryKey: ["me"] });
  if (router.state.location.pathname !== "/login") {
    void router.navigate({ to: "/login", search: { redirect: router.state.location.href } });
  }
});

async function enableMocks() {
  if (import.meta.env.VITE_USE_MOCKS === "false") return;
  const { worker } = await import("./mocks/browser");
  await worker.start({ onUnhandledFrame: "bypass", quiet: true });
}

void enableMocks().then(() => {
  const root = document.getElementById("root");
  if (!root) throw new Error("Không tìm thấy phần tử #root");
  createRoot(root).render(
    <StrictMode>
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
      </QueryClientProvider>
    </StrictMode>,
  );
});
