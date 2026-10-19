import { useQuery } from "@tanstack/react-query";
import { Link, useNavigate } from "@tanstack/react-router";
import {
  ArrowDownUpIcon,
  EllipsisIcon,
  EyeIcon,
  FileTextIcon,
  MessageSquareTextIcon,
  SearchIcon,
  Trash2Icon,
  UploadIcon,
  XIcon,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useMemo, useState } from "react";
import { useUi } from "@/app/uiStore";
import { cn } from "@/shared/lib/cn";
import { formatBytes, formatDateTime, formatNumber } from "@/shared/lib/format";
import type { DocumentItem, DocumentStatus } from "@/shared/types";
import { Button } from "@/shared/ui/button";
import { ConfirmDialog } from "@/shared/ui/dialog";
import { DocumentsIllustration } from "@/shared/ui/illustrations";
import { Input } from "@/shared/ui/input";
import { EmptyState, Skeleton } from "@/shared/ui/misc";
import {
  Checkbox,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/shared/ui/overlays";
import { PageHeader } from "@/shared/ui/PageHeader";
import { documentsQuery } from "./api";
import { Dropzone } from "./Dropzone";
import { StatusBadge } from "./StatusBadge";
import { UploadQueue } from "./UploadQueue";
import { useUploads } from "./uploadStore";
import { deleteDocumentsWithUndo } from "./useDeleteDocuments";

type SortKey = "newest" | "oldest" | "name";
type Filter = "all" | DocumentStatus;

const FILTERS: { value: Filter; label: string }[] = [
  { value: "all", label: "Tất cả" },
  { value: "ready", label: "Sẵn sàng" },
  { value: "processing", label: "Đang xử lý" },
  { value: "failed", label: "Lỗi" },
];

const SORTS: { value: SortKey; label: string }[] = [
  { value: "newest", label: "Mới nhất" },
  { value: "oldest", label: "Cũ nhất" },
  { value: "name", label: "Tên A–Z" },
];

export function DocumentsPage() {
  const navigate = useNavigate();
  const openFilePicker = useUi((s) => s.openFilePicker);
  const { data: documents, isPending } = useQuery(documentsQuery);
  const uploading = useUploads((s) => s.items.length);
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<SortKey>("newest");
  const [filter, setFilter] = useState<Filter>("all");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [confirm, setConfirm] = useState<DocumentItem[] | null>(null);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = (documents ?? []).filter(
      (d) =>
        (filter === "all" || d.status === filter) && (!q || d.fileName.toLowerCase().includes(q)),
    );
    return list.sort((a, b) => {
      if (sort === "name") return a.fileName.localeCompare(b.fileName, "vi");
      return sort === "newest"
        ? b.createdAt.localeCompare(a.createdAt)
        : a.createdAt.localeCompare(b.createdAt);
    });
  }, [documents, query, sort, filter]);

  const selectedDocs = visible.filter((d) => selected.has(d.id));
  const readyCount = documents?.filter((d) => d.status === "ready").length ?? 0;
  const allChecked = visible.length > 0 && selectedDocs.length === visible.length;

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function askAbout(docs: DocumentItem[]) {
    const ids = docs.filter((d) => d.status === "ready").map((d) => d.id);
    void navigate({ to: "/chat", search: { scope: ids.join(",") || undefined } });
  }

  function confirmDelete() {
    if (!confirm) return;
    deleteDocumentsWithUndo(confirm);
    setSelected((prev) => {
      const next = new Set(prev);
      for (const d of confirm) next.delete(d.id);
      return next;
    });
    setConfirm(null);
  }

  const isEmpty = !isPending && (documents?.length ?? 0) === 0 && uploading === 0;

  return (
    <div className="flex h-full flex-col">
      <PageHeader
        actions={
          <Button onClick={openFilePicker} size="sm">
            <UploadIcon /> Tải lên
          </Button>
        }
      >
        <div className="min-w-0">
          <h1 className="text-title font-semibold">Tài liệu</h1>
        </div>
        {documents && documents.length > 0 && (
          <span className="hidden text-small text-fg-muted sm:inline">
            {formatNumber(documents.length)} tài liệu · {formatNumber(readyCount)} sẵn sàng
          </span>
        )}
      </PageHeader>

      <div className="scrollbar-thin flex-1 overflow-y-auto">
        <div className="mx-auto w-full max-w-5xl space-y-6 px-4 py-6 md:px-6">
          {isEmpty ? (
            <>
              <EmptyState
                illustration={<DocumentsIllustration />}
                title="Bắt đầu với tài liệu đầu tiên"
                description="Tải lên hợp đồng, báo cáo hay proposal. Sau đó bạn có thể hỏi bất cứ điều gì về nội dung của chúng."
              />
              <Dropzone />
            </>
          ) : (
            <>
              <Dropzone compact />
              <UploadQueue />

              {/* Thanh công cụ */}
              <div className="flex flex-wrap items-center gap-3">
                <div className="relative min-w-56 flex-1">
                  <SearchIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-fg-muted" />
                  <Input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Tìm theo tên file…"
                    className="pl-9"
                    aria-label="Tìm tài liệu"
                  />
                </div>
                <div
                  className="flex rounded-md bg-surface-3 p-1"
                  role="tablist"
                  aria-label="Lọc theo trạng thái"
                >
                  {FILTERS.map((f) => (
                    <button
                      key={f.value}
                      type="button"
                      role="tab"
                      aria-selected={filter === f.value}
                      onClick={() => setFilter(f.value)}
                      className={cn(
                        "relative rounded-sm px-3 py-1 text-small font-medium text-fg-muted transition-colors",
                        filter === f.value && "text-fg",
                      )}
                    >
                      {filter === f.value && (
                        <motion.span
                          layoutId="doc-filter"
                          className="absolute inset-0 rounded-sm bg-surface shadow-soft"
                          transition={{ type: "spring", stiffness: 400, damping: 32 }}
                        />
                      )}
                      <span className="relative">{f.label}</span>
                    </button>
                  ))}
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm">
                      <ArrowDownUpIcon /> {SORTS.find((s) => s.value === sort)?.label}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    {SORTS.map((s) => (
                      <DropdownMenuItem key={s.value} onSelect={() => setSort(s.value)}>
                        {s.label}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {/* Bảng tài liệu */}
              <div className="overflow-hidden rounded-lg border border-line">
                <table className="w-full text-left">
                  <thead className="bg-surface-2 text-small text-fg-muted">
                    <tr>
                      <th className="w-10 py-2.5 pl-4">
                        <Checkbox
                          checked={
                            allChecked ? true : selectedDocs.length > 0 ? "indeterminate" : false
                          }
                          onCheckedChange={() =>
                            setSelected(allChecked ? new Set() : new Set(visible.map((d) => d.id)))
                          }
                          aria-label="Chọn tất cả"
                        />
                      </th>
                      <th className="py-2.5 pr-4 font-medium">Tên tài liệu</th>
                      <th className="hidden w-40 py-2.5 pr-4 font-medium lg:table-cell">
                        Ngày tải lên
                      </th>
                      <th className="hidden w-24 py-2.5 pr-4 font-medium md:table-cell">
                        Số trang
                      </th>
                      <th className="hidden w-28 py-2.5 pr-4 font-medium md:table-cell">
                        Dung lượng
                      </th>
                      <th className="w-52 py-2.5 pr-4 font-medium">Trạng thái</th>
                      <th className="w-12" />
                    </tr>
                  </thead>
                  <tbody>
                    {isPending &&
                      [0, 1, 2].map((i) => (
                        <tr key={i} className="border-t border-line">
                          <td colSpan={7} className="px-4 py-3">
                            <Skeleton className="h-5" />
                          </td>
                        </tr>
                      ))}
                    <AnimatePresence initial={false}>
                      {visible.map((doc) => (
                        <motion.tr
                          key={doc.id}
                          layout="position"
                          initial={{ opacity: 0, y: -6 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, x: -24, transition: { duration: 0.2 } }}
                          className={cn(
                            "group border-t border-line transition-colors hover:bg-surface-2",
                            selected.has(doc.id) && "bg-brand-soft/50 hover:bg-brand-soft/60",
                          )}
                        >
                          <td className="py-3 pl-4">
                            <Checkbox
                              checked={selected.has(doc.id)}
                              onCheckedChange={() => toggle(doc.id)}
                              aria-label={`Chọn ${doc.fileName}`}
                            />
                          </td>
                          <td className="max-w-0 py-3 pr-4">
                            <Link
                              to="/documents/$documentId"
                              params={{ documentId: doc.id }}
                              className="flex items-center gap-2.5 font-medium hover:text-brand"
                            >
                              <FileTextIcon className="size-4 shrink-0 text-brand" />
                              <span className="truncate">{doc.fileName}</span>
                            </Link>
                          </td>
                          <td className="hidden py-3 pr-4 text-small text-fg-muted lg:table-cell">
                            {formatDateTime(doc.createdAt)}
                          </td>
                          <td className="hidden py-3 pr-4 text-small text-fg-muted tabular-nums md:table-cell">
                            {doc.pageCount ?? "—"}
                          </td>
                          <td className="hidden py-3 pr-4 text-small text-fg-muted tabular-nums md:table-cell">
                            {formatBytes(doc.sizeBytes)}
                          </td>
                          <td className="py-3 pr-4">
                            <StatusBadge doc={doc} />
                          </td>
                          <td className="py-3 pr-3">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon-sm"
                                  aria-label={`Thao tác với ${doc.fileName}`}
                                >
                                  <EllipsisIcon />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent>
                                <DropdownMenuItem
                                  onSelect={() =>
                                    void navigate({
                                      to: "/documents/$documentId",
                                      params: { documentId: doc.id },
                                    })
                                  }
                                >
                                  <EyeIcon /> Xem chi tiết
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  disabled={doc.status !== "ready"}
                                  onSelect={() => askAbout([doc])}
                                >
                                  <MessageSquareTextIcon /> Hỏi về tài liệu này
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem destructive onSelect={() => setConfirm([doc])}>
                                  <Trash2Icon /> Xóa
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </td>
                        </motion.tr>
                      ))}
                    </AnimatePresence>
                  </tbody>
                </table>
                {!isPending && visible.length === 0 && (
                  <p className="border-t border-line py-10 text-center text-fg-muted">
                    Không có tài liệu nào khớp với bộ lọc.
                  </p>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Thanh hành động nổi khi chọn nhiều tài liệu */}
      <AnimatePresence>
        {selectedDocs.length > 0 && (
          <motion.div
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 80, opacity: 0 }}
            transition={{ type: "spring", stiffness: 380, damping: 32 }}
            className="fixed bottom-6 left-1/2 z-30 flex -translate-x-1/2 items-center gap-2 rounded-full border border-line bg-surface py-2 pr-2 pl-5 shadow-float"
          >
            <span className="text-small font-medium tabular-nums">
              Đã chọn {selectedDocs.length}
            </span>
            <span className="mx-1 h-5 w-px bg-line" />
            <Button
              size="sm"
              variant="soft"
              className="rounded-full"
              disabled={!selectedDocs.some((d) => d.status === "ready")}
              onClick={() => askAbout(selectedDocs)}
            >
              <MessageSquareTextIcon /> Hỏi về {selectedDocs.length} tài liệu này
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="rounded-full text-danger"
              onClick={() => setConfirm(selectedDocs)}
            >
              <Trash2Icon /> Xóa
            </Button>
            <Button
              size="icon-sm"
              variant="ghost"
              className="rounded-full"
              aria-label="Bỏ chọn"
              onClick={() => setSelected(new Set())}
            >
              <XIcon />
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      <ConfirmDialog
        open={confirm !== null}
        onOpenChange={(open) => !open && setConfirm(null)}
        title={confirm && confirm.length > 1 ? `Xóa ${confirm.length} tài liệu?` : "Xóa tài liệu?"}
        description="AI sẽ không dùng nội dung của tài liệu này để trả lời nữa. Bạn có 5 giây để hoàn tác."
        confirmLabel="Xóa"
        onConfirm={confirmDelete}
      />
    </div>
  );
}
