import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate, useParams } from "@tanstack/react-router";
import {
  EllipsisIcon,
  FolderOpenIcon,
  LogOutIcon,
  MonitorIcon,
  MoonIcon,
  PanelLeftCloseIcon,
  PanelLeftOpenIcon,
  PencilIcon,
  PlusIcon,
  SparklesIcon,
  SunIcon,
  Trash2Icon,
  UsersIcon,
  WindIcon,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useUi } from "@/app/uiStore";
import { logout, useMe } from "@/features/auth/api";
import { documentsQuery } from "@/features/documents/api";
import { modKey } from "@/shared/hooks/useHotkeys";
import { errorMessage } from "@/shared/lib/api";
import { cn } from "@/shared/lib/cn";
import { groupByDay, initials } from "@/shared/lib/format";
import { spring } from "@/shared/motion/tokens";
import { type Theme, usePreferences } from "@/shared/stores/preferences";
import type { Conversation } from "@/shared/types";
import { Button } from "@/shared/ui/button";
import { ConfirmDialog } from "@/shared/ui/dialog";
import { Kbd, Logo } from "@/shared/ui/misc";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  Tooltip,
} from "@/shared/ui/overlays";
import { conversationsQuery, deleteConversation, updateConversation } from "./api";

const useMocks = import.meta.env.VITE_USE_MOCKS !== "false";

export function Sidebar() {
  const collapsed = usePreferences((s) => s.sidebarCollapsed);
  const toggle = usePreferences((s) => s.toggleSidebar);
  const mobileOpen = useUi((s) => s.mobileSidebarOpen);
  const setMobileOpen = useUi((s) => s.setMobileSidebarOpen);

  return (
    <>
      {/* Máy tính: sidebar cố định, thu gọn được */}
      <motion.nav
        aria-label="Điều hướng chính"
        initial={false}
        animate={{ width: collapsed ? 72 : 276 }}
        transition={spring.gentle}
        className="hidden h-full shrink-0 flex-col border-r border-line bg-surface-2 md:flex"
      >
        <SidebarContent collapsed={collapsed} onToggle={toggle} />
      </motion.nav>

      {/* Di động / màn hình hẹp: drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              className="fixed inset-0 z-40 bg-slate-950/40 md:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
            />
            <motion.nav
              aria-label="Điều hướng chính"
              className="fixed inset-y-0 left-0 z-50 flex w-[280px] flex-col bg-surface-2 shadow-float md:hidden"
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={spring.gentle}
            >
              <SidebarContent collapsed={false} onNavigate={() => setMobileOpen(false)} />
            </motion.nav>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

function SidebarContent({
  collapsed,
  onToggle,
  onNavigate,
}: {
  collapsed: boolean;
  onToggle?: () => void;
  onNavigate?: () => void;
}) {
  const me = useMe();
  const conversations = useQuery(conversationsQuery);
  const documents = useQuery(documentsQuery);
  const processing = documents.data?.filter((d) => d.status === "processing").length ?? 0;
  const groups = groupByDay(conversations.data ?? [], (c) => c.updatedAt);

  return (
    <>
      <div
        className={cn(
          "flex h-14 shrink-0 items-center px-4",
          collapsed ? "justify-center px-0" : "justify-between",
        )}
      >
        <Link to="/chat" onClick={onNavigate} aria-label="Trang chủ">
          <Logo collapsed={collapsed} />
        </Link>
        {onToggle && !collapsed && (
          <Tooltip content="Thu gọn" side="right">
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={onToggle}
              aria-label="Thu gọn thanh bên"
            >
              <PanelLeftCloseIcon />
            </Button>
          </Tooltip>
        )}
      </div>

      <div className={cn("px-3 pb-3", collapsed && "flex flex-col items-center gap-2 px-0")}>
        {collapsed && onToggle && (
          <Tooltip content="Mở rộng" side="right">
            <Button variant="ghost" size="icon" onClick={onToggle} aria-label="Mở rộng thanh bên">
              <PanelLeftOpenIcon />
            </Button>
          </Tooltip>
        )}
        <Tooltip content={`Hội thoại mới (${modKey}+Shift+O)`} side="right">
          <Button
            asChild
            variant="soft"
            size={collapsed ? "icon" : "md"}
            className={cn(!collapsed && "w-full justify-start")}
          >
            <Link to="/chat" search={{}} onClick={onNavigate} aria-label="Hội thoại mới">
              <PlusIcon />
              {!collapsed && <span className="flex-1 text-left">Hội thoại mới</span>}
              {!collapsed && (
                <span className="flex gap-0.5">
                  <Kbd>{modKey}</Kbd>
                  <Kbd>⇧</Kbd>
                  <Kbd>O</Kbd>
                </span>
              )}
            </Link>
          </Button>
        </Tooltip>
      </div>

      <div className="scrollbar-thin min-h-0 flex-1 overflow-y-auto px-3">
        {!collapsed &&
          (conversations.data?.length === 0 ? (
            <p className="px-2 py-6 text-center text-small text-fg-muted">
              Chưa có hội thoại nào.
              <br />
              Hãy đặt câu hỏi đầu tiên!
            </p>
          ) : (
            groups.map((group) => (
              <section key={group.label} className="mb-4">
                <h2 className="px-2 pb-1 text-[11px] font-semibold tracking-wide text-fg-muted uppercase">
                  {group.label}
                </h2>
                <ul>
                  <AnimatePresence initial={false}>
                    {group.items.map((c) => (
                      <ConversationItem key={c.id} conversation={c} onNavigate={onNavigate} />
                    ))}
                  </AnimatePresence>
                </ul>
              </section>
            ))
          ))}
      </div>

      <div
        className={cn(
          "shrink-0 space-y-1 border-t border-line p-3",
          collapsed && "flex flex-col items-center px-0",
        )}
      >
        <NavItem
          to="/documents"
          icon={<FolderOpenIcon />}
          label="Tài liệu"
          collapsed={collapsed}
          onNavigate={onNavigate}
        >
          {processing > 0 && (
            <span className="ml-auto flex items-center gap-1.5 text-[11px] text-brand">
              <span className="size-1.5 animate-pulse rounded-full bg-brand" />
              {processing} đang xử lý
            </span>
          )}
        </NavItem>
        {me.role === "admin" && (
          <NavItem
            to="/admin/users"
            icon={<UsersIcon />}
            label="Quản trị"
            collapsed={collapsed}
            onNavigate={onNavigate}
          />
        )}
        {useMocks && !collapsed && (
          <p className="flex items-center gap-1.5 px-2.5 py-1 text-[11px] text-fg-muted">
            <SparklesIcon className="size-3 text-brand" /> Chế độ demo · dữ liệu giả lập
          </p>
        )}
        <AccountMenu collapsed={collapsed} />
      </div>
    </>
  );
}

function NavItem({
  to,
  icon,
  label,
  collapsed,
  onNavigate,
  children,
}: {
  to: "/documents" | "/admin/users";
  icon: React.ReactNode;
  label: string;
  collapsed: boolean;
  onNavigate?: () => void;
  children?: React.ReactNode;
}) {
  const link = (
    <Link
      to={to}
      onClick={onNavigate}
      aria-label={collapsed ? label : undefined}
      className={cn(
        "flex h-9 items-center gap-2.5 rounded-md px-2.5 text-small font-medium text-fg-muted transition-colors hover:bg-surface-3 hover:text-fg [&_svg]:size-4",
        collapsed && "w-9 justify-center px-0",
      )}
      activeProps={{ className: "bg-surface-3 !text-fg" }}
    >
      {icon}
      {!collapsed && label}
      {!collapsed && children}
    </Link>
  );
  return collapsed ? (
    <Tooltip content={label} side="right">
      {link}
    </Tooltip>
  ) : (
    link
  );
}

function ConversationItem({
  conversation,
  onNavigate,
}: {
  conversation: Conversation;
  onNavigate?: () => void;
}) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const params = useParams({ strict: false }) as { conversationId?: string };
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(conversation.title);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const active = params.conversationId === conversation.id;

  useEffect(() => setTitle(conversation.title), [conversation.title]);

  async function rename() {
    setEditing(false);
    const next = title.trim();
    if (!next || next === conversation.title) return setTitle(conversation.title);
    queryClient.setQueryData<Conversation[]>(["conversations"], (list) =>
      list?.map((c) => (c.id === conversation.id ? { ...c, title: next } : c)),
    );
    try {
      await updateConversation(conversation.id, { title: next });
    } catch (error) {
      toast.error("Không đổi được tên", { description: errorMessage(error) });
      void queryClient.invalidateQueries({ queryKey: ["conversations"] });
    }
  }

  /** Xóa với toast "Hoàn tác" 5 giây (M15) */
  function remove() {
    const previous = queryClient.getQueryData<Conversation[]>(["conversations"]);
    queryClient.setQueryData<Conversation[]>(["conversations"], (list) =>
      list?.filter((c) => c.id !== conversation.id),
    );
    if (active) void navigate({ to: "/chat", search: {} });
    let undone = false;
    const timer = setTimeout(async () => {
      if (undone) return;
      try {
        await deleteConversation(conversation.id);
        queryClient.removeQueries({ queryKey: ["messages", conversation.id] });
      } catch (error) {
        toast.error("Không xóa được hội thoại", { description: errorMessage(error) });
        void queryClient.invalidateQueries({ queryKey: ["conversations"] });
      }
    }, 5000);
    toast(`Đã xóa “${conversation.title}”`, {
      duration: 5000,
      action: {
        label: "Hoàn tác",
        onClick: () => {
          undone = true;
          clearTimeout(timer);
          queryClient.setQueryData(["conversations"], previous);
        },
      },
    });
  }

  return (
    <motion.li
      layout
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, height: 0, transition: { duration: 0.2 } }}
      className="group relative"
    >
      {editing ? (
        <input
          // biome-ignore lint/a11y/noAutofocus: người dùng vừa chủ động bấm đổi tên
          autoFocus
          value={title}
          onChange={(e) => setTitle(e.target.value.slice(0, 60))}
          onBlur={() => void rename()}
          onKeyDown={(e) => {
            if (e.key === "Enter") void rename();
            if (e.key === "Escape") {
              setTitle(conversation.title);
              setEditing(false);
            }
          }}
          aria-label="Tên hội thoại"
          className="h-9 w-full rounded-md border border-brand bg-surface px-2.5 text-small focus:outline-none"
        />
      ) : (
        <Link
          to="/chat/$conversationId"
          params={{ conversationId: conversation.id }}
          search={{}}
          onClick={onNavigate}
          onDoubleClick={() => setEditing(true)}
          className={cn(
            "relative flex h-9 items-center rounded-md pr-8 pl-2.5 text-small text-fg/80 transition-colors hover:bg-surface-3",
            active && "font-medium text-fg",
          )}
        >
          {active && (
            <motion.span
              layoutId="active-conversation"
              className="absolute inset-0 rounded-md bg-surface shadow-soft"
              transition={spring.snappy}
            />
          )}
          <AnimatePresence mode="wait" initial={false}>
            <motion.span
              key={conversation.title}
              initial={{ opacity: 0, x: -4 }}
              animate={{ opacity: 1, x: 0 }}
              className="relative truncate"
            >
              {conversation.title}
            </motion.span>
          </AnimatePresence>
        </Link>
      )}
      {!editing && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon-sm"
              className="absolute top-0.5 right-0.5 size-8 opacity-0 group-hover:opacity-100 focus-visible:opacity-100 data-[state=open]:opacity-100"
              aria-label={`Tùy chọn cho ${conversation.title}`}
            >
              <EllipsisIcon />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            <DropdownMenuItem onSelect={() => setEditing(true)}>
              <PencilIcon /> Đổi tên
            </DropdownMenuItem>
            <DropdownMenuItem destructive onSelect={() => setConfirmOpen(true)}>
              <Trash2Icon /> Xóa
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Xóa hội thoại?"
        description={`“${conversation.title}” và toàn bộ câu trả lời trong đó sẽ bị xóa. Bạn có 5 giây để hoàn tác.`}
        confirmLabel="Xóa"
        onConfirm={remove}
      />
    </motion.li>
  );
}

const THEMES: { value: Theme; label: string; icon: React.ReactNode }[] = [
  { value: "light", label: "Sáng", icon: <SunIcon /> },
  { value: "dark", label: "Tối", icon: <MoonIcon /> },
  { value: "system", label: "Theo hệ thống", icon: <MonitorIcon /> },
];

function AccountMenu({ collapsed }: { collapsed: boolean }) {
  const me = useMe();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { theme, setTheme, reduceMotion, setReduceMotion } = usePreferences();

  async function signOut() {
    await logout().catch(() => undefined);
    queryClient.clear();
    await navigate({ to: "/login", search: {} });
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className={cn(
            "flex w-full items-center gap-2.5 rounded-md p-1.5 text-left transition-colors hover:bg-surface-3",
            collapsed && "w-auto",
          )}
          aria-label="Tài khoản"
        >
          <span className="ai-gradient flex size-8 shrink-0 items-center justify-center rounded-full text-[12px] font-semibold text-white">
            {initials(me.fullName)}
          </span>
          {!collapsed && (
            <span className="min-w-0 leading-tight">
              <span className="block truncate text-small font-medium">{me.fullName}</span>
              <span className="block truncate text-[11px] text-fg-muted">{me.email}</span>
            </span>
          )}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" side="top" className="w-60">
        <DropdownMenuLabel>Giao diện</DropdownMenuLabel>
        {THEMES.map((t) => (
          <DropdownMenuItem key={t.value} onSelect={() => setTheme(t.value)}>
            {t.icon} {t.label}
            {theme === t.value && <span className="ml-auto size-1.5 rounded-full bg-brand" />}
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onSelect={(e) => {
            e.preventDefault();
            setReduceMotion(!reduceMotion);
          }}
        >
          <WindIcon /> Giảm chuyển động
          <span
            className={cn(
              "ml-auto flex h-4 w-7 items-center rounded-full p-0.5 transition-colors",
              reduceMotion ? "bg-brand" : "bg-line",
            )}
          >
            <motion.span
              layout
              className={cn("size-3 rounded-full bg-white", reduceMotion && "ml-auto")}
            />
          </span>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => void signOut()}>
          <LogOutIcon /> Đăng xuất
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
