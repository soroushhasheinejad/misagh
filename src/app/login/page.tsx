import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  SESSION_COOKIE,
  SESSION_MAX_AGE_SECONDS,
  checkPassword,
  createSession,
  isPasswordConfigured,
  verifySession,
} from "@/lib/auth";

export const metadata: Metadata = {
  title: "ورود به پنل",
  robots: { index: false, follow: false },
};

async function login(formData: FormData) {
  "use server";

  const password = String(formData.get("password") ?? "");
  const from = String(formData.get("from") ?? "/admin");
  const target = from.startsWith("/admin") ? from : "/admin";

  if (!checkPassword(password)) {
    redirect(`/login?error=1&from=${encodeURIComponent(target)}`);
  }

  const store = await cookies();
  store.set(SESSION_COOKIE, await createSession(), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  });

  redirect(target);
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; from?: string }>;
}) {
  const { error, from } = await searchParams;

  // اگر نشست معتبر دارد، لازم نیست دوباره وارد شود
  const store = await cookies();
  if (await verifySession(store.get(SESSION_COOKIE)?.value)) {
    redirect(from?.startsWith("/admin") ? from : "/admin");
  }

  const configured = isPasswordConfigured();

  return (
    <div className="mx-auto flex max-w-md flex-col px-5 py-24">
      <span className="block size-[7px] rotate-45 bg-brass" />
      <h1 className="pt-4 font-display text-2xl font-black">ورود به پنل مدیریت</h1>
      <p className="pt-2 text-sm leading-7 text-muted">
        این بخش برای مدیریت فروشگاه است و برای مشتری‌ها باز نیست.
      </p>

      {!configured ? (
        <div className="panel mt-6 border-r-[3px] border-r-alert bg-alert-soft p-4 text-sm leading-7">
          رمز پنل هنوز تنظیم نشده است. مقدارهای <span className="mono">ADMIN_PASSWORD</span> و{" "}
          <span className="mono">AUTH_SECRET</span> را در فایل <span className="mono">.env</span>{" "}
          بگذارید و سرور را دوباره اجرا کنید.
        </div>
      ) : (
        <form action={login} className="panel panel-brass mt-6 flex flex-col gap-4 p-6">
          <input type="hidden" name="from" value={from ?? "/admin"} />

          <label className="block">
            <span className="field-label">رمز عبور</span>
            <input
              name="password"
              type="password"
              required
              autoFocus
              autoComplete="current-password"
              className="field"
            />
          </label>

          {error ? <p className="text-sm text-alert">رمز درست نیست. دوباره امتحان کنید.</p> : null}

          <button type="submit" className="btn btn-brass self-start">
            ورود
          </button>
        </form>
      )}
    </div>
  );
}
