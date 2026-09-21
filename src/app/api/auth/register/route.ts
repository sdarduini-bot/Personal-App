import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import {
  hashPassword,
  createTrainerToken,
  SESSION_COOKIE_NAME,
} from "@/lib/auth-trainer";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const { name, email, password, phone } = await req.json();

    if (!name || !name.trim()) {
      return NextResponse.json({ error: "Nome completo é obrigatório." }, { status: 400 });
    }

    if (!email || !email.includes("@")) {
      return NextResponse.json({ error: "E-mail válido é obrigatório." }, { status: 400 });
    }

    if (!password || password.trim().length < 4) {
      return NextResponse.json(
        { error: "A senha deve ter pelo menos 4 caracteres." },
        { status: 400 }
      );
    }

    const cleanEmail = email.toLowerCase().trim();

    // 1. Verificar se já existe conta com este e-mail
    const existing = await prisma.trainer.findUnique({
      where: { email: cleanEmail },
    });

    if (existing) {
      return NextResponse.json(
        { error: "Já existe uma conta cadastrada com este e-mail. Faça login." },
        { status: 409 }
      );
    }

    // 2. Criar novo treinador com 14 dias de Trial Grátis
    const trialEndsAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);

    const trainer = await prisma.trainer.create({
      data: {
        name: name.trim(),
        email: cleanEmail,
        passwordHash: hashPassword(password),
        phone: phone ? phone.trim() : null,
        pixKey: cleanEmail,
        bio: "Personal Trainer",
        subscriptionStatus: "TRIAL",
        trialEndsAt,
      },
    });

    // 3. Criar token de sessão e setar cookie
    const token = await createTrainerToken({
      trainerId: trainer.id,
      email: trainer.email,
      name: trainer.name,
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

    return NextResponse.json(
      {
        success: true,
        message: "Conta criada com sucesso! Bem-vindo ao teste grátis de 14 dias.",
        trainer: {
          id: trainer.id,
          name: trainer.name,
          email: trainer.email,
          subscriptionStatus: trainer.subscriptionStatus,
          trialEndsAt: trainer.trialEndsAt,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Erro ao registrar novo professor:", error);
    return NextResponse.json(
      { error: "Erro interno no servidor ao criar conta." },
      { status: 500 }
    );
  }
}
