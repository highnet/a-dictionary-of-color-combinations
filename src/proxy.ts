import { NextResponse, type NextRequest } from "next/server";

/**
 * English is served at the original, unprefixed URLs and Japanese under /ja.
 * Unprefixed requests are rewritten to /en internally; /en/... redirects to
 * the unprefixed URL so each page has one English address.
 */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (pathname === "/ja" || pathname.startsWith("/ja/")) return;
  if (pathname === "/en" || pathname.startsWith("/en/")) {
    const url = request.nextUrl.clone();
    url.pathname = pathname.slice(3) || "/";
    return NextResponse.redirect(url, 308);
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
