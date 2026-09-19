import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import {
  checkRateLimit,
  recordFailedAttempt,
  resetFailedAttempts,
  verifyPin,
  hashPin,
  createSessionToken,
} from "@/lib/auth-security";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    // Identificador para rate limiting (IP ou fallback)
    const forwardedFor = req.headers.get("x-forwarded-for");
    const ip = forwardedFor ? forwardedFor.split(",")[0].trim() : "local_client";

    // 1. Verificar Rate Limiting (Bloqueio contra força bruta)
    const rateCheck = checkRateLimit(ip);
    if (!rateCheck.allowed) {
      return NextResponse.json(
        {
          error: `Muitas tentativas incorretas. Acesso bloqueado temporariamente por ${rateCheck.lockoutSeconds} segundos.`,
          locked: true,
          lockoutSeconds: rateCheck.lockoutSeconds,
        },
        { status: 429 }
      );
    }

    const { pin } = await req.json();

    if (!pin || typeof pin !== "string") {
      return NextResponse.json({ error: "PIN é obrigatório" }, { status: 400 });
    }

    let trainer = await prisma.trainerSettings.findUnique({
      where: { id: "trainer" },
    });

    if (!trainer) {
      trainer = await prisma.trainerSettings.create({
        data: {
          id: "trainer",
          name: "Pedro Personal",
          pin: hashPin("1234"),
        },
      });
    }

    const valid = verifyPin(pin, trainer.pin);

    if (!valid) {
      const attempt = recordFailedAttempt(ip);
      if (attempt.isLocked) {
        return NextResponse.json(
          {
            error: `PIN incorreto. Limite atingido! Acesso bloqueado por ${attempt.lockoutSeconds} segundos.`,
            locked: true,
            lockoutSeconds: attempt.lockoutSeconds,
          },
          { status: 429 }
        );
      }
      return NextResponse.json(
        {
          error: `PIN incorreto. Restam ${attempt.remainingAttempts} tentativas antes do bloqueio.`,
          remainingAttempts: attempt.remainingAttempts,
        },
        { status: 401 }
      );
    }

    // Se o PIN ainda estava em texto puro (sem salt ':'), migrar automaticamente para hash scrypt
    if (!trainer.pin.includes(":")) {
      await prisma.trainerSettings.update({
        where: { id: "trainer" },
        data: { pin: hashPin(pin) },
      });
    }

    // Resetar tentativas falhas após sucesso
    resetFailedAttempts(ip);

    // Gerar token de sessão criptograficamente assinado com HMAC-SHA256
    const sessionToken = await createSessionToken();

    // Gravar cookie seguro com flag httpOnly
    const cookieStore = cookies();
    cookieStore.set("pedro_pt_session", sessionToken, {
      httpOnly: true, // Protegido contra ataques de XSS
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 30, // 30 dias
      path: "/",
    });

    return NextResponse.json({ success: true, message: "Acesso autorizado com sucesso" });
  } catch (error) {
    console.error("Erro no login seguro:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
