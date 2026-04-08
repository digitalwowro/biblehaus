import { getLocale } from "@/lib/i18n/locale";
import { AccountPageClient } from "@/components/account/account-page-client";

export default async function AccountPage() {
  const locale = await getLocale();
  return <AccountPageClient locale={locale} />;
}
