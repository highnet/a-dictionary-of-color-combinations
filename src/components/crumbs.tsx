import { Fragment } from "react";
import Link from "next/link";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { SITE } from "@/lib/site";
import { JsonLd } from "./json-ld";

export type Crumb = { href: string; label: string };

/** Breadcrumb trail + BreadcrumbList structured data. Last crumb is the current page. */
export function Crumbs({ items, className }: { items: Crumb[]; className?: string }) {
  const all = [{ href: "/", label: "Home" }, ...items];
  return (
    <>
      <Breadcrumb className={className}>
        <BreadcrumbList className="text-[0.8rem] text-sumi-soft">
          {all.map((c, i) => {
            const last = i === all.length - 1;
            return (
              <Fragment key={c.href}>
                <BreadcrumbItem>
                  {last ? (
                    <span aria-current="page" className="text-sumi">{c.label}</span>
                  ) : (
                    <BreadcrumbLink render={<Link href={c.href} />} className="link-quiet hover:text-sumi">
                      {c.label}
                    </BreadcrumbLink>
                  )}
                </BreadcrumbItem>
                {!last ? <BreadcrumbSeparator>/</BreadcrumbSeparator> : null}
              </Fragment>
            );
          })}
        </BreadcrumbList>
      </Breadcrumb>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: all.map((c, i) => ({
            "@type": "ListItem",
            position: i + 1,
            name: c.label,
            item: `${SITE.url}${c.href}`,
          })),
        }}
      />
    </>
  );
}
