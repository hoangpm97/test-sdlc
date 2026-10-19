import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { CheckIcon, ShieldCheckIcon } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { errorMessage } from "@/shared/lib/api";
import { cn } from "@/shared/lib/cn";
import { Button } from "@/shared/ui/button";
import { FieldError, Input, Label } from "@/shared/ui/input";
import { Logo } from "@/shared/ui/misc";
import { changePassword } from "./api";

const RULES = [
  { label: "Ít nhất 10 ký tự", test: (p: string) => p.length >= 10 },
  { label: "Có chữ cái", test: (p: string) => /\p{L}/u.test(p) },
  { label: "Có chữ số", test: (p: string) => /\d/.test(p) },
  { label: "Có ký tự đặc biệt (khuyến nghị)", test: (p: string) => /[^\p{L}\d]/u.test(p) },
];

const LEVELS = [
  { label: "Rất yếu", className: "bg-danger" },
  { label: "Yếu", className: "bg-danger" },
  { label: "Trung bình", className: "bg-warning" },
  { label: "Mạnh", className: "bg-success" },
  { label: "Rất mạnh", className: "bg-success" },
];

export function ChangePasswordPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const passed = RULES.map((r) => r.test(password));
  const score = passed.filter(Boolean).length;
  const valid = passed.slice(0, 3).every(Boolean);
  const level = LEVELS[password ? score : 0] ?? LEVELS[0];

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!valid) return setError("Mật khẩu chưa đạt các điều kiện bắt buộc.");
    if (password !== confirm) return setError("Mật khẩu xác nhận không khớp.");
    setSubmitting(true);
    setError(null);
    try {
      const me = await changePassword(password);
      queryClient.setQueryData(["me"], me);
      await navigate({ to: "/chat" });
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-full flex-col items-center justify-center bg-surface-2 px-4 py-10">
      <Logo />
      <motion.form
        onSubmit={onSubmit}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="mt-8 w-full max-w-md rounded-lg border border-line bg-surface p-8 shadow-soft"
        noValidate
      >
        <div className="flex size-11 items-center justify-center rounded-full bg-brand-soft text-brand">
          <ShieldCheckIcon className="size-5" />
        </div>
        <h1 className="mt-4 text-title font-semibold">Đặt mật khẩu mới</h1>
        <p className="mt-1 text-fg-muted">
          Đây là lần đăng nhập đầu tiên. Hãy đổi mật khẩu tạm để bảo vệ tài khoản.
        </p>

        <div className="mt-6 space-y-1.5">
          <Label htmlFor="new-password">Mật khẩu mới</Label>
          <Input
            id="new-password"
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          {/* Thanh đo độ mạnh */}
          <div className="flex items-center gap-3 pt-1">
            <div className="flex h-1.5 flex-1 gap-1">
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className="flex-1 overflow-hidden rounded-full bg-surface-3">
                  <motion.div
                    className={cn("h-full rounded-full", level?.className)}
                    initial={false}
                    animate={{ width: i < score && password ? "100%" : "0%" }}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  />
                </div>
              ))}
            </div>
            <span className="w-20 text-right text-small text-fg-muted">
              {password ? level?.label : ""}
            </span>
          </div>
        </div>

        <ul className="mt-3 space-y-1.5">
          {RULES.map((rule, i) => (
            <li key={rule.label} className="flex items-center gap-2 text-small">
              <motion.span
                initial={false}
                animate={{
                  scale: passed[i] ? [1, 1.25, 1] : 1,
                  backgroundColor: passed[i] ? "var(--success)" : "var(--surface-3)",
                }}
                className="flex size-4 items-center justify-center rounded-full text-white"
              >
                {passed[i] && <CheckIcon className="size-3" strokeWidth={3} />}
              </motion.span>
              <span className={passed[i] ? "text-fg" : "text-fg-muted"}>{rule.label}</span>
            </li>
          ))}
        </ul>

        <div className="mt-5 space-y-1.5">
          <Label htmlFor="confirm-password">Xác nhận mật khẩu</Label>
          <Input
            id="confirm-password"
            type="password"
            autoComplete="new-password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            aria-invalid={Boolean(confirm) && confirm !== password}
          />
        </div>
        <div className="mt-3">
          <FieldError>{error ?? undefined}</FieldError>
        </div>
        <Button type="submit" size="lg" className="mt-6 w-full" disabled={submitting}>
          {submitting ? "Đang lưu…" : "Lưu và tiếp tục"}
        </Button>
      </motion.form>
    </div>
  );
}
