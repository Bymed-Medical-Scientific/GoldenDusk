import { BYMED_ACCESS_COOKIE } from "@/lib/auth/cookie-names";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

export function middleware(request: NextRequest) {
  if (!request.nextUrl.pathname.startsWith("/account")) {
    return NextResponse.next();
  }

  if (!request.cookies.get(BYMED_ACCESS_COOKIE)?.value) {
    const login = new URL("/login", request.url);
    login.searchParams.set(
      "from",
      `${request.nextUrl.pathname}${request.nextUrl.search}`,
    );
    return NextResponse.redirect(login);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/account", "/account/:path*"],
};
