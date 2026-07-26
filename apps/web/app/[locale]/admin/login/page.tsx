import { setRequestLocale } from "next-intl/server";
import { AdminLoginForm } from "@/components/admin-login-form";

export default async function AdminLoginPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <div className="flex flex-1 flex-col items-center justify-center bg-zinc-50 px-6 py-12 dark:bg-black">
      <AdminLoginForm />
    </div>
  );
}
