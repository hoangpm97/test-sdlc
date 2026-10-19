import { useQuery } from "@tanstack/react-query";
import { Link, useNavigate, useParams } from "@tanstack/react-router";
import {
  ArrowLeftIcon,
  CalendarIcon,
  FileTextIcon,
  HardDriveIcon,
  LightbulbIcon,
  MessageSquareTextIcon,
  SparklesIcon,
  Trash2Icon,
} from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { LazyPdfViewer } from "@/features/pdf-viewer/LazyPdfViewer";
import { errorText } from "@/shared/i18n/errors";
import { formatBytes, formatDateTime } from "@/shared/lib/format";
import { fadeUp, staggerContainer } from "@/shared/motion/tokens";
import { Button } from "@/shared/ui/button";
import { ConfirmDialog } from "@/shared/ui/dialog";
import { NotFoundIllustration } from "@/shared/ui/illustrations";
import { EmptyState, Skeleton } from "@/shared/ui/misc";
import { PageHeader } from "@/shared/ui/PageHeader";
import { documentQuery } from "./api";
import { StatusBadge } from "./StatusBadge";
import { deleteDocumentsWithUndo } from "./useDeleteDocuments";

export function DocumentDetailPage() {
  const { documentId } = useParams({ from: "/_app/documents/$documentId" });
  const navigate = useNavigate();
  const { data: doc, isPending, isError } = useQuery(documentQuery(documentId));
  const [confirmOpen, setConfirmOpen] = useState(false);

  if (isError || (!isPending && !doc)) {
    return (
      <EmptyState
        illustration={<NotFoundIllustration />}
        title="Không tìm thấy tài liệu"
        description="Tài liệu có thể đã bị xóa."
        action={
          <Button asChild variant="outline">
            <Link to="/documents">Quay lại danh sách</Link>
          </Button>
        }
      />
    );
  }

  return (
    <div className="flex h-full flex-col">
      <PageHeader
        actions={
          <>
            <Button
              variant="ghost"
              size="sm"
              className="text-danger"
              onClick={() => setConfirmOpen(true)}
              disabled={!doc}
            >
              <Trash2Icon /> <span className="hidden sm:inline">Xóa</span>
            </Button>
            <Button
              size="sm"
              disabled={doc?.status !== "ready"}
              onClick={() => void navigate({ to: "/chat", search: { scope: documentId } })}
            >
              <MessageSquareTextIcon /> Hỏi về tài liệu này
            </Button>
          </>
        }
      >
        <Button variant="ghost" size="icon-sm" asChild>
          <Link to="/documents" aria-label="Quay lại danh sách tài liệu">
            <ArrowLeftIcon />
          </Link>
        </Button>
        <FileTextIcon className="size-5 shrink-0 text-brand" />
        <h1 className="truncate text-title font-semibold">{doc?.fileName ?? "…"}</h1>
        {doc && (
          <span className="hidden sm:inline-flex">
            <StatusBadge doc={doc} />
          </span>
        )}
      </PageHeader>

      <div className="grid min-h-0 flex-1 lg:grid-cols-[minmax(0,1fr)_380px]">
        <section className="min-h-[60vh] border-line lg:border-r" aria-label="Nội dung tài liệu">
          {doc?.status === "failed" ? (
            <div className="p-8 text-center text-fg-muted">
              {errorText(doc.errorCode ?? "E-07", { name: doc.fileName })}
            </div>
          ) : (
            <LazyPdfViewer documentId={documentId} />
          )}
        </section>

        <aside className="scrollbar-thin space-y-6 overflow-y-auto bg-surface-2 p-6">
          <div className="grid grid-cols-3 gap-3 text-small">
            <Meta icon={<FileTextIcon />} label="Số trang" value={doc?.pageCount ?? "—"} />
            <Meta
              icon={<HardDriveIcon />}
              label="Dung lượng"
              value={doc ? formatBytes(doc.sizeBytes) : "—"}
            />
            <Meta
              icon={<CalendarIcon />}
              label="Tải lên"
              value={doc ? formatDateTime(doc.createdAt).split(" ")[0] : "—"}
            />
          </div>

          <section className="rounded-lg border border-line bg-surface p-5 shadow-soft">
            <h2 className="flex items-center gap-2 font-semibold">
              <SparklesIcon className="size-4 text-brand" /> Tóm tắt
            </h2>
            {doc?.summary ? (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="mt-3 leading-relaxed text-fg/90"
              >
                {doc.summary}
              </motion.p>
            ) : doc?.status === "processing" ? (
              <div className="mt-3 space-y-2">
                <p className="shimmer-text text-small">Đang tạo tóm tắt…</p>
                <Skeleton className="h-4" />
                <Skeleton className="h-4 w-11/12" />
                <Skeleton className="h-4 w-4/5" />
              </div>
            ) : (
              <p className="mt-3 text-small text-fg-muted">
                Chưa tạo được tóm tắt cho tài liệu này.
              </p>
            )}
          </section>

          {doc?.keyPoints && doc.keyPoints.length > 0 && (
            <section>
              <h2 className="flex items-center gap-2 font-semibold">
                <LightbulbIcon className="size-4 text-warning" /> Ý chính
              </h2>
              <motion.ul
                variants={staggerContainer(0.06)}
                initial="hidden"
                animate="show"
                className="mt-3 space-y-2.5"
              >
                {doc.keyPoints.map((point) => (
                  <motion.li
                    key={point}
                    variants={fadeUp}
                    className="flex gap-2.5 rounded-md border border-line bg-surface p-3 text-small leading-relaxed"
                  >
                    <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-brand" />
                    {point}
                  </motion.li>
                ))}
              </motion.ul>
            </section>
          )}
        </aside>
      </div>

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Xóa tài liệu?"
        description="AI sẽ không dùng nội dung của tài liệu này để trả lời nữa. Bạn có 5 giây để hoàn tác."
        confirmLabel="Xóa"
        onConfirm={() => {
          if (doc) deleteDocumentsWithUndo([doc]);
          void navigate({ to: "/documents" });
        }}
      />
    </div>
  );
}

function Meta({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="rounded-md border border-line bg-surface p-3 [&_svg]:size-4 [&_svg]:text-fg-muted">
      {icon}
      <p className="mt-2 text-[12px] text-fg-muted">{label}</p>
      <p className="font-medium tabular-nums">{value}</p>
    </div>
  );
}
