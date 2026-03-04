import { NextRequest, NextResponse } from "next/server";

const SESSION_COOKIE_NAME = "jobtrackr_session";

export function middleware(request: NextRequest) {
  const sessionToken = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  if (sessionToken) {
    return NextResponse.next();
  }

  const redirectUrl = request.nextUrl.clone();
  const nextPath = `${request.nextUrl.pathname}${request.nextUrl.search}`;

  redirectUrl.pathname = "/";
  redirectUrl.search = "";
  redirectUrl.searchParams.set("auth", "required");
  redirectUrl.searchParams.set("next", nextPath);

  return NextResponse.redirect(redirectUrl);
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/tracker/:path*",
    "/timeline/:path*",
    "/resumes/:path*",
    "/referrals/:path*",
    "/cold-email/:path*"
  ]
};
