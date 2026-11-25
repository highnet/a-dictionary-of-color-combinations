import Link from "@/i18n/link";
import { getT } from "@/i18n/server";
import { rich } from "@/i18n/rich";

export async function SiteFooter() {
  const { t } = await getT();
  return (
    <footer className="ground-sumi">
      <div className="shell grid gap-10 py-16 md:grid-cols-12">
        {/* A haiku: 5-7-5 syllables in English, 5-7-5 morae in Japanese. */}
        <p className="font-display text-2xl leading-snug md:col-span-5" aria-label={`${t("footer.haikuLabel")}: ${t("footer.line1")} ${t("footer.line2")} ${t("footer.line3")}`}>
          <span aria-hidden="true">
            {t("footer.line1")}
            <br />
            <span className="pl-6">{t("footer.line2")}</span>
            <br />
            {t("footer.line3")}
          </span>
        </p>
        <div className="space-y-3 text-sm leading-relaxed text-sumi-soft md:col-span-4">
          <p>{rich(t("footer.credit"))}</p>
          <p className="pl-6 -indent-6" lang="en">
            Wada, Sanzō. <i>A Dictionary of Color Combinations</i>. Vol. 1, Seigensha, 2010.
          </p>
          <p>
            {t("footer.data")}{" "}
            <Link className="link-quiet" href="/about#works-cited">
              {t("footer.worksCited")}
            </Link>
            . {t("footer.independent")}
          </p>
        </div>
        <nav aria-label={t("nav.footer")} className="text-sm md:col-span-3">
          <ul className="space-y-2">
            <li><Link className="link-quiet" href="/combinations">{t("nav.combinations")}</Link></li>
            <li><Link className="link-quiet" href="/colours">{t("nav.colours")}</Link></li>
            <li><Link className="link-quiet" href="/explore">{t("nav.explore")}</Link></li>
            <li><Link className="link-quiet" href="/wada">{t("nav.wada")}</Link></li>
            <li><Link className="link-quiet" href="/about">{t("nav.aboutSources")}</Link></li>
            <li><a className="link-quiet" href="/sitemap.xml">{t("nav.sitemap")}</a></li>
          </ul>
        </nav>
      </div>
    </footer>
  );
}
