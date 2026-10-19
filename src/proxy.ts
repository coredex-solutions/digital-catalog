import { NextResponse, type NextRequest } from "next/server";

const ONE_YEAR = 60 * 60 * 24 * 365;

export function proxy(request: NextRequest) {
  const headers = new Headers(request.headers);
  // The root layout sets <html lang dir> from the path (see app/document-lang.ts)
  headers.set("x-pathname", request.nextUrl.pathname);

  // A menu link with ?lang=ar|en renders in that language straight away and remembers it, the
  // same as the menu's own language switch (cookie menu_lang_<slug>). Without this the first
  // render would use the old language and the page would switch after loading.
  const slug = request.nextUrl.pathname.match(/^\/c\/([^/]+)/)?.[1];
  const lang = request.nextUrl.searchParams.get("lang")?.toLowerCase();
  if (slug && (lang === "ar" || lang === "en")) {
    const name = `menu_lang_${slug}`;
    const others = (headers.get("cookie") || "").split(/;\s*/).filter((part) => part && !part.startsWith(`${name}=`));
    headers.set("cookie", [...others, `${name}=${lang}`].join("; "));
    const response = NextResponse.next({ request: { headers } });
    response.cookies.set(name, lang, { path: "/", maxAge: ONE_YEAR, sameSite: "lax" });
    return response;
  }

  return NextResponse.next({ request: { headers } });
}

export const config = {
  // Pages only: not the API, build assets or files such as icon.svg
  matcher: ["/((?!api/|_next/|.*\\.[a-z0-9]+$).*)"],
};
