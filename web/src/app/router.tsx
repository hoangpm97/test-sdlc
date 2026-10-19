import type { QueryClient } from "@tanstack/react-query";
import {
  createRootRouteWithContext,
  createRoute,
  createRouter,
  isRedirect,
  lazyRouteComponent,
  redirect,
} from "@tanstack/react-router";
import { meQuery } from "@/features/auth/api";
import { ChatPage, type ChatSearch } from "@/features/chat/ChatPage";
import { AppShell } from "./AppShell";
import { queryClient } from "./queryClient";
import { NotFoundPage, RootLayout } from "./RootLayout";

const rootRoute = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  component: RootLayout,
  notFoundComponent: NotFoundPage,
});

/* ---------- Công khai ---------- */
// Các trang ngoài Chat được tách chunk riêng để giảm JS ban đầu (plan mục 9)
const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/login",
  validateSearch: (search: Record<string, unknown>): { redirect?: string } => ({
    redirect: typeof search.redirect === "string" ? search.redirect : undefined,
  }),
  component: lazyRouteComponent(() => import("@/features/auth/LoginPage"), "LoginPage"),
});

const changePasswordRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/change-password",
  beforeLoad: async ({ context }) => {
    try {
      await context.queryClient.ensureQueryData(meQuery);
    } catch {
      throw redirect({ to: "/login", search: {} });
    }
  },
  component: lazyRouteComponent(
    () => import("@/features/auth/ChangePasswordPage"),
    "ChangePasswordPage",
  ),
});

/* ---------- Cần đăng nhập (auth guard) ---------- */
const appRoute = createRoute({
  getParentRoute: () => rootRoute,
  id: "_app",
  beforeLoad: async ({ context, location }) => {
    try {
      const me = await context.queryClient.ensureQueryData(meQuery);
      if (me.status === "must_change_password") throw redirect({ to: "/change-password" });
      return { me };
    } catch (error) {
      if (isRedirect(error)) throw error;
      throw redirect({ to: "/login", search: { redirect: location.href } });
    }
  },
  component: AppShell,
});

const indexRoute = createRoute({
  getParentRoute: () => appRoute,
  path: "/",
  beforeLoad: () => {
    throw redirect({ to: "/chat", search: {} });
  },
});

function validateChatSearch(search: Record<string, unknown>): ChatSearch {
  const page = Number(search.page);
  return {
    scope: typeof search.scope === "string" && search.scope ? search.scope : undefined,
    doc: typeof search.doc === "string" && search.doc ? search.doc : undefined,
    page: Number.isInteger(page) && page > 0 ? page : undefined,
  };
}

const chatRoute = createRoute({
  getParentRoute: () => appRoute,
  path: "/chat",
  validateSearch: validateChatSearch,
  component: ChatPage,
});

const conversationRoute = createRoute({
  getParentRoute: () => appRoute,
  path: "/chat/$conversationId",
  validateSearch: validateChatSearch,
  component: ChatPage,
});

const documentsRoute = createRoute({
  getParentRoute: () => appRoute,
  path: "/documents",
  component: lazyRouteComponent(
    () => import("@/features/documents/DocumentsPage"),
    "DocumentsPage",
  ),
});

const documentDetailRoute = createRoute({
  getParentRoute: () => appRoute,
  path: "/documents/$documentId",
  component: lazyRouteComponent(
    () => import("@/features/documents/DocumentDetailPage"),
    "DocumentDetailPage",
  ),
});

const adminUsersRoute = createRoute({
  getParentRoute: () => appRoute,
  path: "/admin/users",
  beforeLoad: ({ context }) => {
    if (context.me.role !== "admin") throw redirect({ to: "/chat", search: {} });
  },
  component: lazyRouteComponent(() => import("@/features/admin/AdminUsersPage"), "AdminUsersPage"),
});

const routeTree = rootRoute.addChildren([
  loginRoute,
  changePasswordRoute,
  appRoute.addChildren([
    indexRoute,
    chatRoute,
    conversationRoute,
    documentsRoute,
    documentDetailRoute,
    adminUsersRoute,
  ]),
]);

export const router = createRouter({
  routeTree,
  context: { queryClient },
  defaultPreload: "intent",
  scrollRestoration: true,
});

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}
