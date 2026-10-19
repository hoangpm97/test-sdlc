import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  BanIcon,
  CheckCircle2Icon,
  CoinsIcon,
  MessageCircleQuestionIcon,
  UserPlusIcon,
  UsersIcon,
} from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { useMe } from "@/features/auth/api";
import { api, errorMessage } from "@/shared/lib/api";
import { cn } from "@/shared/lib/cn";
import { formatCompact, formatDateTime, formatNumber, initials } from "@/shared/lib/format";
import { zodResolver } from "@/shared/lib/zodResolver";
import { fadeUp, staggerContainer } from "@/shared/motion/tokens";
import type { AdminUserRow, AdminUsersResponse, User, UserStatus } from "@/shared/types";
import { Button } from "@/shared/ui/button";
import { Dialog, DialogContent, DialogHeader } from "@/shared/ui/dialog";
import { FieldError, Input, Label } from "@/shared/ui/input";
import { Badge, Skeleton } from "@/shared/ui/misc";
import { PageHeader } from "@/shared/ui/PageHeader";

const adminUsersQuery = {
  queryKey: ["admin", "users"],
  queryFn: () => api<AdminUsersResponse>("/admin/users"),
};

const STATUS: Record<UserStatus, { label: string; tone: "success" | "neutral" | "warning" }> = {
  active: { label: "Đang hoạt động", tone: "success" },
  disabled: { label: "Đã vô hiệu hóa", tone: "neutral" },
  must_change_password: { label: "Chờ đổi mật khẩu", tone: "warning" },
};

export function AdminUsersPage() {
  const me = useMe();
  const queryClient = useQueryClient();
  const { data, isPending } = useQuery(adminUsersQuery);
  const [createOpen, setCreateOpen] = useState(false);

  async function setStatus(user: AdminUserRow, status: "active" | "disabled") {
    try {
      await api<User>(`/admin/users/${user.id}`, { method: "PATCH", json: { status } });
      toast.success(
        status === "disabled" ? `Đã vô hiệu hóa ${user.fullName}` : `Đã kích hoạt ${user.fullName}`,
      );
      void queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
    } catch (error) {
      toast.error(errorMessage(error));
    }
  }

  const budgetPct = data
    ? Math.min(100, (data.summary.tokensMonth / data.summary.monthlyTokenBudget) * 100)
    : 0;

  return (
    <div className="flex h-full flex-col">
      <PageHeader
        actions={
          <Button size="sm" onClick={() => setCreateOpen(true)}>
            <UserPlusIcon /> Tạo người dùng
          </Button>
        }
      >
        <h1 className="text-title font-semibold">Quản trị người dùng</h1>
      </PageHeader>

      <div className="scrollbar-thin flex-1 overflow-y-auto">
        <div className="mx-auto w-full max-w-5xl space-y-6 px-4 py-6 md:px-6">
          {/* Thẻ số liệu */}
          <motion.div
            variants={staggerContainer(0.06)}
            initial="hidden"
            animate="show"
            className="grid gap-4 sm:grid-cols-3"
          >
            <StatCard
              icon={<UsersIcon />}
              label="Người dùng"
              value={data ? formatNumber(data.users.length) : null}
            />
            <StatCard
              icon={<MessageCircleQuestionIcon />}
              label="Câu hỏi hôm nay"
              value={data ? formatNumber(data.summary.questionsToday) : null}
            />
            <motion.div
              variants={fadeUp}
              className="rounded-lg border border-line bg-surface p-5 shadow-soft"
            >
              <div className="flex items-center gap-2 text-small text-fg-muted [&_svg]:size-4">
                <CoinsIcon /> Ngân sách AI tháng này
              </div>
              {data ? (
                <>
                  <p className="mt-2 text-display font-semibold tabular-nums">
                    {Math.round(budgetPct)}%
                  </p>
                  <div className="mt-2 h-2 overflow-hidden rounded-full bg-surface-3">
                    <motion.div
                      className={cn(
                        "h-full rounded-full",
                        budgetPct >= 80 ? "bg-warning" : "ai-gradient",
                      )}
                      initial={{ width: 0 }}
                      animate={{ width: `${budgetPct}%` }}
                      transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1], delay: 0.2 }}
                    />
                  </div>
                  <p className="mt-1.5 text-[12px] text-fg-muted">
                    {formatCompact(data.summary.tokensMonth)} /{" "}
                    {formatCompact(data.summary.monthlyTokenBudget)} token
                    {budgetPct >= 80 && <span className="text-warning"> · sắp vượt ngân sách</span>}
                  </p>
                </>
              ) : (
                <Skeleton className="mt-3 h-12" />
              )}
            </motion.div>
          </motion.div>

          <div className="overflow-hidden rounded-lg border border-line">
            <table className="w-full text-left">
              <thead className="bg-surface-2 text-small text-fg-muted">
                <tr>
                  <th className="py-2.5 pl-4 font-medium">Người dùng</th>
                  <th className="hidden py-2.5 pr-4 font-medium md:table-cell">Trạng thái</th>
                  <th className="hidden py-2.5 pr-4 font-medium lg:table-cell">
                    Đăng nhập gần nhất
                  </th>
                  <th className="py-2.5 pr-4 text-right font-medium">Câu hỏi hôm nay</th>
                  <th className="hidden py-2.5 pr-4 text-right font-medium sm:table-cell">
                    Token tháng
                  </th>
                  <th className="w-36" />
                </tr>
              </thead>
              <tbody>
                {isPending &&
                  [0, 1, 2].map((i) => (
                    <tr key={i} className="border-t border-line">
                      <td colSpan={6} className="px-4 py-3">
                        <Skeleton className="h-8" />
                      </td>
                    </tr>
                  ))}
                {data?.users.map((u) => (
                  <tr key={u.id} className="border-t border-line hover:bg-surface-2">
                    <td className="py-3 pl-4">
                      <div className="flex items-center gap-3">
                        <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-brand-soft text-[12px] font-semibold text-brand-soft-fg">
                          {initials(u.fullName)}
                        </span>
                        <div className="min-w-0">
                          <p className="truncate text-small font-medium">
                            {u.fullName}
                            {u.role === "admin" && (
                              <Badge tone="brand" className="ml-2 py-0 text-[11px]">
                                Admin
                              </Badge>
                            )}
                          </p>
                          <p className="truncate text-[12px] text-fg-muted">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="hidden py-3 pr-4 md:table-cell">
                      <Badge tone={STATUS[u.status].tone}>{STATUS[u.status].label}</Badge>
                    </td>
                    <td className="hidden py-3 pr-4 text-small text-fg-muted lg:table-cell">
                      {u.lastLoginAt ? formatDateTime(u.lastLoginAt) : "Chưa đăng nhập"}
                    </td>
                    <td className="py-3 pr-4 text-right text-small tabular-nums">
                      {formatNumber(u.questionsToday)}
                    </td>
                    <td className="hidden py-3 pr-4 text-right text-small text-fg-muted tabular-nums sm:table-cell">
                      {formatCompact(u.tokensMonth)}
                    </td>
                    <td className="py-3 pr-3 text-right">
                      {u.id !== me.id &&
                        (u.status === "disabled" ? (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => void setStatus(u, "active")}
                          >
                            <CheckCircle2Icon /> Kích hoạt
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-danger"
                            onClick={() => void setStatus(u, "disabled")}
                          >
                            <BanIcon /> Vô hiệu hóa
                          </Button>
                        ))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-[12px] text-fg-muted">
            Quản trị viên quản lý tài khoản nhưng không xem được nội dung tài liệu hay hội thoại của
            người dùng (SP-02).
          </p>
        </div>
      </div>

      <CreateUserSheet open={createOpen} onOpenChange={setCreateOpen} />
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | null;
}) {
  return (
    <motion.div
      variants={fadeUp}
      className="rounded-lg border border-line bg-surface p-5 shadow-soft"
    >
      <div className="flex items-center gap-2 text-small text-fg-muted [&_svg]:size-4">
        {icon} {label}
      </div>
      {value === null ? (
        <Skeleton className="mt-3 h-9 w-20" />
      ) : (
        <p className="mt-2 text-display font-semibold tabular-nums">{value}</p>
      )}
    </motion.div>
  );
}

const createSchema = z.object({
  fullName: z.string().trim().min(2, "Vui lòng nhập họ tên."),
  email: z.email("Email không hợp lệ."),
  tempPassword: z
    .string()
    .min(10, "Mật khẩu tạm cần ít nhất 10 ký tự.")
    .regex(/\p{L}/u, "Cần có chữ cái.")
    .regex(/\d/, "Cần có chữ số."),
});
type CreateValues = z.infer<typeof createSchema>;

/** Form tạo người dùng dạng sheet trượt từ phải (FR-05) */
function CreateUserSheet({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const queryClient = useQueryClient();
  const [serverError, setServerError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateValues>({
    resolver: zodResolver(createSchema),
    defaultValues: { fullName: "", email: "", tempPassword: "" },
  });

  async function onSubmit(values: CreateValues) {
    setServerError(null);
    try {
      await api<User>("/admin/users", { method: "POST", json: values });
      toast.success(`Đã tạo tài khoản cho ${values.fullName}`, {
        description: "Người dùng sẽ phải đổi mật khẩu ở lần đăng nhập đầu tiên.",
      });
      void queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
      reset();
      onOpenChange(false);
    } catch (error) {
      setServerError(errorMessage(error));
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent side="right">
        <DialogHeader
          title="Tạo người dùng"
          description="Tài khoản mới ở trạng thái “Chờ đổi mật khẩu” cho tới lần đăng nhập đầu tiên."
        />
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-1 flex-col gap-4" noValidate>
          <div className="space-y-1.5">
            <Label htmlFor="fullName">Họ và tên</Label>
            <Input
              id="fullName"
              aria-invalid={Boolean(errors.fullName)}
              {...register("fullName")}
            />
            <FieldError>{errors.fullName?.message}</FieldError>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="new-email">Email công ty</Label>
            <Input
              id="new-email"
              type="email"
              aria-invalid={Boolean(errors.email)}
              {...register("email")}
            />
            <FieldError>{errors.email?.message}</FieldError>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="tempPassword">Mật khẩu tạm</Label>
            <Input
              id="tempPassword"
              aria-invalid={Boolean(errors.tempPassword)}
              {...register("tempPassword")}
            />
            <FieldError>{errors.tempPassword?.message}</FieldError>
          </div>
          <FieldError>{serverError ?? undefined}</FieldError>
          <div className="mt-auto flex justify-end gap-2 border-t border-line pt-4">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Hủy
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Đang tạo…" : "Tạo tài khoản"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
