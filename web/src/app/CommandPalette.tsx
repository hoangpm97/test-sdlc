import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { Command } from "cmdk";
import {
  FileTextIcon,
  FolderOpenIcon,
  LogOutIcon,
  MessageSquareIcon,
  MoonIcon,
  PlusIcon,
  SearchIcon,
  SunIcon,
  UploadIcon,
  WindIcon,
} from "lucide-react";
import { Dialog as DialogPrimitive } from "radix-ui";
import type { ReactNode } from "react";
import { logout } from "@/features/auth/api";
import { conversationsQuery } from "@/features/conversations/api";
import { documentsQuery } from "@/features/documents/api";
import { resolveDark, usePreferences } from "@/shared/stores/preferences";
import { Kbd } from "@/shared/ui/misc";
import { useUi } from "./uiStore";

/** Ctrl/⌘+K: tìm hội thoại, tài liệu và thao tác nhanh (plan mục 5.3) */
export function CommandPalette() {
  const open = useUi((s) => s.commandOpen);
  const setOpen = useUi((s) => s.setCommandOpen);
  const openFilePicker = useUi((s) => s.openFilePicker);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const conversations = useQuery({ ...conversationsQuery, enabled: open });
  const documents = useQuery({ ...documentsQuery, enabled: open });
  const { theme, setTheme, reduceMotion, setReduceMotion } = usePreferences();

  function run(action: () => void) {
    setOpen(false);
    action();
  }

  return (
    <DialogPrimitive.Root open={open} onOpenChange={setOpen}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-slate-950/40 backdrop-blur-[2px] data-[state=closed]:animate-fade-out data-[state=open]:animate-fade-in" />
        <DialogPrimitive.Content className="fixed top-[14vh] left-1/2 z-50 w-[calc(100%-2rem)] max-w-xl -translate-x-1/2 overflow-hidden rounded-lg border border-line bg-surface shadow-float data-[state=closed]:animate-pop-out data-[state=open]:animate-pop-in">
          <DialogPrimitive.Title className="sr-only">Tìm nhanh</DialogPrimitive.Title>
          <DialogPrimitive.Description className="sr-only">
            Tìm hội thoại, tài liệu hoặc thao tác
          </DialogPrimitive.Description>
          <Command
            label="Tìm nhanh"
            loop
            className="[&_[cmdk-group-heading]]:px-3 [&_[cmdk-group-heading]]:pt-3 [&_[cmdk-group-heading]]:pb-1 [&_[cmdk-group-heading]]:text-[11px] [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:tracking-wide [&_[cmdk-group-heading]]:text-fg-muted [&_[cmdk-group-heading]]:uppercase"
          >
            <div className="flex items-center gap-2 border-b border-line px-4">
              <SearchIcon className="size-4 text-fg-muted" />
              <Command.Input
                placeholder="Tìm hội thoại, tài liệu, thao tác…"
                className="h-12 flex-1 bg-transparent text-body focus:outline-none"
              />
              <Kbd>Esc</Kbd>
            </div>
            <Command.List className="scrollbar-thin max-h-[52vh] overflow-y-auto p-2">
              <Command.Empty className="py-10 text-center text-small text-fg-muted">
                Không tìm thấy kết quả phù hợp.
              </Command.Empty>

              <Command.Group heading="Thao tác">
                <Item
                  icon={<PlusIcon />}
                  onSelect={() => run(() => void navigate({ to: "/chat", search: {} }))}
                  hint="Ctrl ⇧ O"
                >
                  Hội thoại mới
                </Item>
                <Item icon={<UploadIcon />} onSelect={() => run(openFilePicker)} hint="Ctrl U">
                  Tải tài liệu lên
                </Item>
                <Item
                  icon={<FolderOpenIcon />}
                  onSelect={() => run(() => void navigate({ to: "/documents" }))}
                >
                  Mở trang Tài liệu
                </Item>
                <Item
                  icon={resolveDark(theme) ? <SunIcon /> : <MoonIcon />}
                  onSelect={() => run(() => setTheme(resolveDark(theme) ? "light" : "dark"))}
                >
                  Chuyển sang giao diện {resolveDark(theme) ? "sáng" : "tối"}
                </Item>
                <Item
                  icon={<WindIcon />}
                  onSelect={() => run(() => setReduceMotion(!reduceMotion))}
                >
                  {reduceMotion ? "Tắt" : "Bật"} giảm chuyển động
                </Item>
              </Command.Group>

              {(conversations.data?.length ?? 0) > 0 && (
                <Command.Group heading="Hội thoại">
                  {conversations.data?.slice(0, 8).map((c) => (
                    <Item
                      key={c.id}
                      value={`hoi-thoai ${c.title} ${c.id}`}
                      icon={<MessageSquareIcon />}
                      onSelect={() =>
                        run(
                          () =>
                            void navigate({
                              to: "/chat/$conversationId",
                              params: { conversationId: c.id },
                              search: {},
                            }),
                        )
                      }
                    >
                      {c.title}
                    </Item>
                  ))}
                </Command.Group>
              )}

              {(documents.data?.length ?? 0) > 0 && (
                <Command.Group heading="Tài liệu">
                  {documents.data?.slice(0, 10).map((d) => (
                    <Item
                      key={d.id}
                      value={`tai-lieu ${d.fileName} ${d.id}`}
                      icon={<FileTextIcon />}
                      onSelect={() =>
                        run(
                          () =>
                            void navigate({
                              to: "/documents/$documentId",
                              params: { documentId: d.id },
                            }),
                        )
                      }
                    >
                      {d.fileName}
                    </Item>
                  ))}
                </Command.Group>
              )}

              <Command.Group heading="Tài khoản">
                <Item
                  icon={<LogOutIcon />}
                  onSelect={() =>
                    run(async () => {
                      await logout().catch(() => undefined);
                      queryClient.clear();
                      await navigate({ to: "/login", search: {} });
                    })
                  }
                >
                  Đăng xuất
                </Item>
              </Command.Group>
            </Command.List>
          </Command>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}

function Item({
  icon,
  children,
  onSelect,
  hint,
  value,
}: {
  icon: ReactNode;
  children: ReactNode;
  onSelect: () => void;
  hint?: string;
  value?: string;
}) {
  return (
    <Command.Item
      value={value}
      onSelect={onSelect}
      className="flex cursor-default items-center gap-3 rounded-md px-3 py-2.5 text-small data-[selected=true]:bg-brand-soft data-[selected=true]:text-brand-soft-fg [&_svg]:size-4 [&_svg]:shrink-0 [&_svg]:text-fg-muted data-[selected=true]:[&_svg]:text-brand"
    >
      {icon}
      <span className="flex-1 truncate">{children}</span>
      {hint && <span className="text-[11px] text-fg-muted">{hint}</span>}
    </Command.Item>
  );
}
