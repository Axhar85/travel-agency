import { setRequestLocale } from "next-intl/server";
import { AccountLoginForm } from "@/components/account-login-form";

export default async function AccountLoginPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <div className="flex flex-1 flex-col items-center justify-center px-6 py-12">
      <AccountLoginForm />
    </div>
  );
}
