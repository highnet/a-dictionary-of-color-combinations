import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="ground-sumi">
      <div className="shell grid gap-10 py-16 md:grid-cols-12">
        <p className="font-display text-2xl leading-snug md:col-span-5">
          The colours are Wada&rsquo;s.
          <br />
          The order is his.
          <br />
          The use is yours.
        </p>
        <div className="space-y-3 text-sm leading-relaxed text-sumi-soft md:col-span-4">
          <p>
            Combinations by Sanzo Wada (1883–1967), first published as <i>Haishoku Sōkan</i> <span lang="ja">配色總鑑</span>, 1933–34.
          </p>
          <p className="pl-6 -indent-6">
            Wada, Sanzō. <i>A Dictionary of Color Combinations</i>. Vol. 1, Seigensha, 2010.
          </p>
          <p>
            Colour data from DesLauriers, after Kim, under MIT.{" "}
            <Link className="link-quiet" href="/about#works-cited">
              Works Cited
            </Link>
            . Independent project, not affiliated with the publisher.
          </p>
        </div>
        <nav aria-label="Footer" className="text-sm md:col-span-3">
          <ul className="space-y-2">
            <li><Link className="link-quiet" href="/combinations">All combinations</Link></li>
            <li><Link className="link-quiet" href="/colours">Colour search</Link></li>
            <li><Link className="link-quiet" href="/explore">Explore</Link></li>
            <li><Link className="link-quiet" href="/wada">Sanzo Wada</Link></li>
            <li><Link className="link-quiet" href="/about">About &amp; sources</Link></li>
            <li><a className="link-quiet" href="/sitemap.xml">Sitemap</a></li>
          </ul>
        </nav>
      </div>
    </footer>
  );
}
