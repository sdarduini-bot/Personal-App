import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createPasswordResetToken, sendPasswordResetEmail } from "@/lib/email";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const { email } = await req.json();

    if (!email || !email.includes("@")) {
      return NextResponse.json(
        { error: "Informe um endereço de e-mail válido." },
        { status: 400 }
      );
    }

    const cleanEmail = email.toLowerCase().trim();

    // 1. Localizar treinador
    const trainer = await prisma.trainer.findUnique({
      where: { email: cleanEmail },
    });

    // Se o treinador existir e estiver ativo, gera token e envia e-mail
    if (trainer && trainer.isActive) {
      const token = await createPasswordResetToken(cleanEmail);

      // Obter URL base da requisição
      const host = req.headers.get("x-forwarded-host") || req.headers.get("host") || "localhost:3000";
      const proto = req.headers.get("x-forwarded-proto") || (host.includes("localhost") ? "http" : "https");
      const baseUrl = `${proto}://${host}`;

      await sendPasswordResetEmail(cleanEmail, token, baseUrl);
    }

    // Resposta padrão (prevenção contra enumeração de e-mails)
    return NextResponse.json({
      success: true,
      message:
        "Se este e-mail estiver cadastrado em nossa base, você receberá um link seguro para redefinir a sua senha em instantes. Verifique também sua pasta de Spam.",
    });
  } catch (error) {
    console.error("Erro na rota forgot-password:", error);
    return NextResponse.json(
      { error: "Ocorreu um erro ao processar a solicitação. Tente novamente." },
      { status: 500 }
    );
  }
}
