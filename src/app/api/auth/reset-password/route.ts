import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import {
  hashPassword,
  createTrainerToken,
  SESSION_COOKIE_NAME,
} from "@/lib/auth-trainer";

export const dynamic = "force-dynamic";

/**
 * GET: Valida se o token de reset ou convite ainda é válido antes de exibir o formulário
 */
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const token = searchParams.get("token");

    if (!token) {
      return NextResponse.json({ valid: false, error: "Token não fornecido." }, { status: 400 });
    }

    const tokenRecord = await prisma.passwordResetToken.findUnique({
      where: { token },
    });

    if (!tokenRecord) {
      return NextResponse.json({ valid: false, error: "Link inválido ou não encontrado." }, { status: 404 });
    }

    if (tokenRecord.used) {
      return NextResponse.json(
        { valid: false, error: "Este link já foi utilizado anteriormente." },
        { status: 400 }
      );
    }

    if (new Date() > new Date(tokenRecord.expiresAt)) {
      return NextResponse.json(
        { valid: false, error: "Este link expirou. Solicite um novo link de acesso." },
        { status: 400 }
      );
    }

    const trainer = await prisma.trainer.findUnique({
      where: { email: tokenRecord.email },
      select: { id: true, name: true, email: true },
    });

    if (!trainer) {
      return NextResponse.json({ valid: false, error: "Conta de treinador não encontrada." }, { status: 404 });
    }

    return NextResponse.json({
      valid: true,
      email: tokenRecord.email,
      name: trainer.name,
      type: tokenRecord.type,
    });
  } catch (error) {
    console.error("Erro ao validar token:", error);
    return NextResponse.json({ valid: false, error: "Erro ao validar link." }, { status: 500 });
  }
}

/**
 * POST: Salva a nova senha e inicia a sessão automaticamente
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { token, newPassword } = body;

    if (!token || !newPassword) {
      return NextResponse.json(
        { error: "Token e nova senha são obrigatórios." },
        { status: 400 }
      );
    }

    if (newPassword.trim().length < 4) {
      return NextResponse.json(
        { error: "A senha deve conter no mínimo 4 caracteres." },
        { status: 400 }
      );
    }

    const tokenRecord = await prisma.passwordResetToken.findUnique({
      where: { token },
    });

    if (!tokenRecord || tokenRecord.used || new Date() > new Date(tokenRecord.expiresAt)) {
      return NextResponse.json(
        { error: "Link inválido, expirado ou já utilizado. Solicite um novo." },
        { status: 400 }
      );
    }

    const trainer = await prisma.trainer.findUnique({
      where: { email: tokenRecord.email },
    });

    if (!trainer) {
      return NextResponse.json({ error: "Treinador não encontrado." }, { status: 404 });
    }

    // 1. Atualizar senha no banco
    const updatedTrainer = await prisma.trainer.update({
      where: { id: trainer.id },
      data: {
        passwordHash: hashPassword(newPassword.trim()),
        isActive: true, // Garante que a conta fique ativa
      },
    });

    // 2. Marcar token como utilizado
    await prisma.passwordResetToken.update({
      where: { id: tokenRecord.id },
      data: { used: true },
    });

    // 3. Logar o usuário automaticamente com cookie de sessão
    const sessionToken = await createTrainerToken({
      trainerId: updatedTrainer.id,
      email: updatedTrainer.email,
      name: updatedTrainer.name,
      role: updatedTrainer.role,
    });

    const isProduction = process.env.NODE_ENV === "production";
    const cookieStore = cookies();
    cookieStore.set(SESSION_COOKIE_NAME, sessionToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: "lax",
      maxAge: 30 * 24 * 60 * 60, // 30 dias
      path: "/",
    });

    return NextResponse.json({
      success: true,
      message: "Senha cadastrada com sucesso! Redirecionando para o painel...",
      trainer: {
        id: updatedTrainer.id,
        name: updatedTrainer.name,
        email: updatedTrainer.email,
        role: updatedTrainer.role,
      },
    });
  } catch (error) {
    console.error("Erro ao redefinir senha:", error);
    return NextResponse.json({ error: "Erro ao processar nova senha." }, { status: 500 });
  }
}
