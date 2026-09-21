import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifyWebSessionToken } from "@/lib/auth-token-web";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Identificar se é uma rota privada da API do treinador
  const isPrivateApi =
    pathname.startsWith("/api/students") ||
    pathname.startsWith("/api/payments") ||
    pathname.startsWith("/api/classes") ||
    pathname.startsWith("/api/workouts") ||
    pathname.startsWith("/api/dashboard") ||
    pathname.startsWith("/api/upload") ||
    pathname.startsWith("/api/settings");

  if (isPrivateApi) {
    const sessionCookie = request.cookies.get("pedro_pt_session")?.value;
    const isValid = await verifyWebSessionToken(sessionCookie);

    if (!isValid) {
      const unauthResponse = NextResponse.json(
        {
          error: "Acesso não autorizado. Autentique-se com o PIN mestre.",
          authenticated: false,
        },
        { status: 401 }
      );
      unauthResponse.headers.set("X-Content-Type-Options", "nosniff");
      unauthResponse.headers.set("X-Frame-Options", "DENY");
      unauthResponse.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
      return unauthResponse;
    }
  }

  // 2. Prosseguir com a requisição e injetar cabeçalhos de segurança (OWASP)
  const response = NextResponse.next();

  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set("Permissions-Policy", "camera=(self), microphone=(), geolocation=()");

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|icon.svg|manifest.json).*)",
  ],
};
