import { NextResponse, type NextRequest } from "next/server";

/**
 * English is served at the original, unprefixed URLs and Japanese under /ja.
 * Unprefixed requests are rewritten to /en internally; /en/... redirects to
 * the unprefixed URL so each page has one English address. Search engines
 * see both versions (no cookie, hreflang links between them).
 */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (pathname === "/ja" || pathname.startsWith("/ja/")) return;
  if (pathname === "/en" || pathname.startsWith("/en/")) {
    const url = request.nextUrl.clone();
    url.pathname = pathname.slice(3) || "/";
    return NextResponse.redirect(url, 308);
  }
  // A reader who chose Japanese (cookie set by the language switch) gets /ja.
  // Only page navigations: prefetches and data requests are left alone.
  const isNavigation = request.method === "GET" && request.headers.get("sec-fetch-dest") === "document";
  if (isNavigation && request.cookies.get("dcc-lang")?.value === "ja") {
    const url = request.nextUrl.clone();
    url.pathname = `/ja${pathname === "/" ? "" : pathname}`;
    return NextResponse.redirect(url, 307);
  }
  const url = request.nextUrl.clone();
  url.pathname = `/en${pathname === "/" ? "" : pathname}`;
  return NextResponse.rewrite(url);
}

export const config = {
  // Pages only: skip the API, Next internals, metadata routes and any file with an extension.
  matcher: [
    "/((?!api/|_next/|_vercel/|sitemap\\.xml|robots\\.txt|manifest\\.webmanifest|icon|apple-icon|opengraph-image|llms\\.txt|skills\\.md|.*\\.[a-zA-Z0-9]+$).*)",
  ],
};
