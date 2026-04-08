import { getLocale } from "@/lib/i18n/locale";
import { LoginPageClient } from "@/components/account/login-page-client";

export default async function UserLoginPage() {
  const locale = await getLocale();
  return <LoginPageClient locale={locale} />;
}
