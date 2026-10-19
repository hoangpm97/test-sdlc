import { useQueryClient } from "@tanstack/react-query";
import { useNavigate, useSearch } from "@tanstack/react-router";
import { EyeIcon, EyeOffIcon, LockIcon, SparklesIcon } from "lucide-react";
import { motion } from "motion/react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { DEMO_ACCOUNTS } from "@/mocks/db";
import { ApiError, errorMessage } from "@/shared/lib/api";
import { zodResolver } from "@/shared/lib/zodResolver";
import { Button } from "@/shared/ui/button";
import { FieldError, Input, Label } from "@/shared/ui/input";
import { AiAvatar, Logo } from "@/shared/ui/misc";
import { login } from "./api";

const schema = z.object({
  email: z.email("Email không hợp lệ."),
  password: z.string().min(1, "Vui lòng nhập mật khẩu."),
});
type FormValues = z.infer<typeof schema>;

const useMocks = import.meta.env.VITE_USE_MOCKS !== "false";

function useCountdown(until: number | null) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!until) return;
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [until]);
  if (!until || until <= now) return null;
  const seconds = Math.ceil((until - now) / 1000);
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
}

export function LoginPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { redirect } = useSearch({ from: "/login" });
  const [showPassword, setShowPassword] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [lockedUntil, setLockedUntil] = useState<number | null>(null);
  const countdown = useCountdown(lockedUntil);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: "", password: "" },
  });

  async function onSubmit(values: FormValues) {
    setFormError(null);
    try {
      const me = await login(values.email, values.password);
      queryClient.setQueryData(["me"], me);
      if (me.status === "must_change_password") {
        await navigate({ to: "/change-password" });
      } else {
        await navigate({ to: redirect?.startsWith("/") ? redirect : "/chat" });
      }
    } catch (error) {
      if (error instanceof ApiError && error.code === "E-LOCKED") {
        setLockedUntil(new Date(String(error.details.lockedUntil)).getTime());
      }
      setFormError(errorMessage(error));
    }
  }

  return (
    <div className="grid min-h-full lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
      {/* Cột form */}
      <div className="flex flex-col px-6 py-8 sm:px-12">
        <Logo />
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center py-12"
        >
          <h1 className="text-display font-semibold tracking-tight">Chào mừng trở lại</h1>
          <p className="mt-2 text-fg-muted">Đăng nhập để tiếp tục tra cứu tài liệu của bạn.</p>

          <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-4" noValidate>
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="ten@congty.vn"
                aria-invalid={Boolean(errors.email)}
                {...register("email")}
              />
              <FieldError>{errors.email?.message}</FieldError>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password">Mật khẩu</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  className="pr-10"
                  aria-invalid={Boolean(errors.password)}
                  {...register("password")}
                />
                <Button
                  variant="ghost"
                  size="icon-sm"
                  className="absolute top-1 right-1"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                >
                  {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                </Button>
              </div>
              <FieldError>{errors.password?.message}</FieldError>
            </div>

            {formError && (
              <motion.div
                role="alert"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="flex items-start gap-2 rounded-md bg-danger/10 px-3 py-2.5 text-small text-danger"
              >
                {countdown && <LockIcon className="mt-0.5 size-4 shrink-0" />}
                <span>
                  {formError}
                  {countdown && (
                    <>
                      {" "}
                      Thử lại sau <strong className="tabular-nums">{countdown}</strong>.
                    </>
                  )}
                </span>
              </motion.div>
            )}

            <Button
              type="submit"
              size="lg"
              className="w-full"
              disabled={isSubmitting || Boolean(countdown)}
            >
              {isSubmitting ? "Đang đăng nhập…" : "Đăng nhập"}
            </Button>
          </form>

          {useMocks && (
            <div className="mt-8 rounded-lg border border-dashed border-line p-4">
              <p className="flex items-center gap-1.5 text-small font-medium">
                <SparklesIcon className="size-4 text-brand" /> Tài khoản demo
              </p>
              <ul className="mt-2 space-y-1">
                {DEMO_ACCOUNTS.map((a) => (
                  <li key={a.email}>
                    <button
                      type="button"
                      className="w-full rounded-sm px-2 py-1 text-left text-small hover:bg-surface-3"
                      onClick={() => {
                        setValue("email", a.email, { shouldValidate: true });
                        setValue("password", a.password, { shouldValidate: true });
                      }}
                    >
                      <span className="font-medium">{a.email}</span>
                      <span className="text-fg-muted"> · {a.label}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </motion.div>
        <p className="text-small text-fg-muted">
          Chỉ dành cho nhân viên nội bộ đội Phát triển Kinh doanh.
        </p>
      </div>

      {/* Cột minh họa – nền gradient động (M17) */}
      <div className="relative hidden overflow-hidden bg-surface-2 lg:block">
        <div aria-hidden className="absolute inset-0">
          <div className="absolute -top-1/4 -left-1/4 size-[70%] animate-mesh rounded-full bg-ai-from/30 blur-3xl" />
          <div className="absolute -right-1/4 -bottom-1/4 size-[70%] animate-mesh rounded-full bg-ai-to/30 blur-3xl [animation-delay:-12s]" />
          <div className="absolute top-1/3 left-1/3 size-[45%] animate-mesh rounded-full bg-brand/20 blur-3xl [animation-delay:-24s]" />
        </div>
        {[
          { top: "12%", left: "10%", rotate: -8, delay: 0 },
          { top: "62%", left: "72%", rotate: 10, delay: 1.2 },
          { top: "74%", left: "14%", rotate: 4, delay: 2.1 },
        ].map((card) => (
          <motion.div
            key={card.top}
            aria-hidden
            className="absolute h-28 w-20 rounded-md border border-line/70 bg-surface/60 p-2.5 shadow-soft backdrop-blur"
            style={{ top: card.top, left: card.left, rotate: card.rotate }}
            animate={{ y: [0, -10, 0] }}
            transition={{
              duration: 6,
              repeat: Number.POSITIVE_INFINITY,
              delay: card.delay,
              ease: "easeInOut",
            }}
          >
            <div className="h-1.5 w-10 rounded bg-brand/40" />
            <div className="mt-2 space-y-1.5">
              <div className="h-1 rounded bg-fg-muted/25" />
              <div className="h-1 w-4/5 rounded bg-fg-muted/25" />
              <div className="h-1 w-3/5 rounded bg-fg-muted/25" />
            </div>
          </motion.div>
        ))}

        <div className="relative flex h-full flex-col items-center justify-center px-12">
          <motion.h2
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="max-w-md text-center text-[2.5rem] leading-tight font-semibold tracking-tight"
          >
            Hỏi bất cứ điều gì.
            <br />
            <span className="ai-gradient-text">Nhận câu trả lời kèm bằng chứng.</span>
          </motion.h2>

          {/* Bản xem trước cuộc hội thoại */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="glass mt-10 w-full max-w-md space-y-3 rounded-lg border border-line/60 p-4 shadow-float"
          >
            <div className="ml-auto w-fit max-w-[85%] rounded-lg rounded-br-sm bg-brand-soft px-3.5 py-2 text-small text-brand-soft-fg">
              Điều khoản thanh toán với đối tác X là gì?
            </div>
            <div className="flex gap-2.5">
              <AiAvatar size={24} />
              <p className="text-small leading-relaxed">
                Đối tác X thanh toán trong vòng 30 ngày kể từ khi nhận hóa đơn{" "}
                <span className="inline-flex size-4.5 items-center justify-center rounded-[5px] bg-brand-soft align-text-top text-[10px] font-semibold text-brand-soft-fg">
                  1
                </span>
                , phạt 0,05%/ngày nếu chậm{" "}
                <span className="inline-flex size-4.5 items-center justify-center rounded-[5px] bg-brand-soft align-text-top text-[10px] font-semibold text-brand-soft-fg">
                  2
                </span>
                .
              </p>
            </div>
            <div className="flex gap-2 pl-8">
              {["hop-dong-X.pdf · tr. 4", "hop-dong-X.pdf · tr. 5"].map((s) => (
                <span
                  key={s}
                  className="rounded-sm border border-line bg-surface px-2 py-1 text-[11px] text-fg-muted"
                >
                  {s}
                </span>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
