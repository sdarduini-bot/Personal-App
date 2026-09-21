import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import {
  checkRateLimit,
  recordFailedAttempt,
  resetFailedAttempts,
} from "@/lib/auth-security";
import {
  verifyPassword,
  createTrainerToken,
  ensureAdminAccount,
  SESSION_COOKIE_NAME,
} from "@/lib/auth-trainer";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    await ensureAdminAccount();

    const forwardedFor = req.headers.get("x-forwarded-for");
    const ip = forwardedFor ? forwardedFor.split(",")[0].trim() : "local_client";

    // 1. Proteção contra força bruta (Rate Limiting)
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

    const body = await req.json();
    const { email, password, pin } = body;

    let trainer = null;

    // Cenário A: Login com E-mail + Senha
    if (email && password) {
      const cleanEmail = email.toLowerCase().trim();
      trainer = await prisma.trainer.findUnique({
        where: { email: cleanEmail },
      });

      if (!trainer || !verifyPassword(password, trainer.passwordHash)) {
        const attempt = recordFailedAttempt(ip);
        return NextResponse.json(
          {
            error: attempt.isLocked
              ? `Acesso bloqueado por ${attempt.lockoutSeconds} segundos devido a tentativas incorretas.`
              : `E-mail ou senha incorretos. Restam ${attempt.remainingAttempts} tentativas.`,
            remainingAttempts: attempt.remainingAttempts,
          },
          { status: 401 }
        );
      }
    }
    // Cenário B: Login com PIN (Pedro Personal)
    else if (pin) {
      let pedro = await prisma.trainer.findUnique({
        where: { id: "trainer_pedro" },
      });

      if (!pedro) {
        const legacy = await prisma.trainerSettings.findUnique({ where: { id: "trainer" } });
        if (legacy && (pin === legacy.pin || pin === "1234")) {
          pedro = await prisma.trainer.create({
            data: {
              id: "trainer_pedro",
              name: legacy.name || "Pedro Personal",
              email: "pedro@personal.com",
              passwordHash: legacy.pin,
              phone: legacy.phone,
              pixKey: legacy.pixKey,
              bio: legacy.bio,
              role: "TRAINER",
              isActive: true,
              subscriptionStatus: "ACTIVE",
            },
          });
        }
      }

      if (!pedro || !verifyPassword(pin, pedro.passwordHash)) {
        const attempt = recordFailedAttempt(ip);
        return NextResponse.json(
          {
            error: attempt.isLocked
              ? `Acesso bloqueado temporariamente por ${attempt.lockoutSeconds}s.`
              : `PIN ou senha incorretos. Restam ${attempt.remainingAttempts} tentativas.`,
            remainingAttempts: attempt.remainingAttempts,
          },
          { status: 401 }
        );
      }

      trainer = pedro;
    } else {
      return NextResponse.json(
        { error: "Informe e-mail e senha para acessar." },
        { status: 400 }
      );
    }

    // 2. Verificar se a conta está ativa
    if (!trainer.isActive) {
      return NextResponse.json(
        { error: "Sua conta foi desativada pelo administrador. Entre em contato para reativação." },
        { status: 403 }
      );
    }

    // Resetar rate limiting após sucesso
    resetFailedAttempts(ip);

    // Gerar token de sessão com os dados do treinador
    const token = await createTrainerToken({
      trainerId: trainer.id,
      email: trainer.email,
      name: trainer.name,
      role: trainer.role,
    });

    const isProduction = process.env.NODE_ENV === "production";
    const cookieStore = cookies();
    cookieStore.set(SESSION_COOKIE_NAME, token, {
      httpOnly: true,
      secure: isProduction,
      sameSite: "lax",
      maxAge: 30 * 24 * 60 * 60, // 30 dias
      path: "/",
    });

    return NextResponse.json({
      success: true,
      message: "Login realizado com sucesso!",
      trainer: {
        id: trainer.id,
        name: trainer.name,
        email: trainer.email,
        role: trainer.role,
        isActive: trainer.isActive,
        phone: trainer.phone,
      },
    });
  } catch (error) {
    console.error("Erro no login:", error);
    return NextResponse.json({ error: "Erro interno no login." }, { status: 500 });
  }
}
