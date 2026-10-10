import { NextResponse, type NextFetchEvent, type NextRequest } from "next/server";

export default async function proxy(request: NextRequest, event: NextFetchEvent) {
  const clerk = Boolean(process.env.CLERK_SECRET_KEY && process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);
  if (!clerk) {
    const response = NextResponse.next();
    if (!request.cookies.get("mw_demo")) {
      response.cookies.set("mw_demo", "1", {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/",
      });
    }
    return response;
  }

  const { clerkMiddleware } = await import("@clerk/nextjs/server");
  return clerkMiddleware()(request, event);
}

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
    "/__clerk/(.*)",
  ],
};
