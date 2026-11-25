import Link from "@/i18n/link";
import { getT } from "@/i18n/server";

export default async function NotFound() {
  const { t } = await getT();
  return (
    <div className="shell grid min-h-[70vh] content-center gap-8 py-24">
      <title>{t("notFound.metaTitle")}</title>
      <p className="cartouche w-fit text-2xl">404</p>
      <h1 className="font-display text-[clamp(2.4rem,5vw,4.4rem)] leading-tight font-extrabold">{t("notFound.title")}</h1>
      <p className="text-lg text-sumi-soft">{t("notFound.body")}</p>
      <div className="flex flex-wrap gap-3">
        <Link href="/combinations" className="inline-flex min-h-12 items-center bg-sumi px-6 text-washi">{t("nav.combinations")}</Link>
        <Link href="/" className="inline-flex min-h-12 items-center border border-sumi px-6">{t("nav.home")}</Link>
      </div>
    </div>
  );
}
