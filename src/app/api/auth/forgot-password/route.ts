import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createPasswordResetToken, sendPasswordResetEmail } from "@/lib/email";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const identifier = (body.identifier || body.email || "").toString().trim();

    if (!identifier) {
      return NextResponse.json(
        { error: "Informe seu e-mail ou WhatsApp cadastrado." },
        { status: 400 }
      );
    }

    let trainer = null;

    if (identifier.includes("@")) {
      // 1. Busca por e-mail
      const cleanEmail = identifier.toLowerCase().trim();
      trainer = await prisma.trainer.findUnique({
        where: { email: cleanEmail },
      });
    } else {
      // 2. Busca por número de celular / WhatsApp
      const cleanDigits = identifier.replace(/\D/g, "");
      if (cleanDigits.length < 8) {
        return NextResponse.json(
          { error: "Informe um e-mail válido ou WhatsApp com DDD." },
          { status: 400 }
        );
      }

      // Procurar treinador cujo telefone coincida com os dígitos informados
      const trainers = await prisma.trainer.findMany({
        where: { isActive: true },
        select: { id: true, name: true, email: true, phone: true, isActive: true },
      });

      trainer =
        trainers.find((t) => {
          if (!t.phone) return false;
          const tDigits = t.phone.replace(/\D/g, "");
          return (
            tDigits.endsWith(cleanDigits) ||
            cleanDigits.endsWith(tDigits) ||
            tDigits === cleanDigits
          );
        }) || null;
    }

    if (!trainer || !trainer.isActive) {
      return NextResponse.json(
        {
          error:
            "Não localizamos nenhum treinador ativo com este e-mail ou WhatsApp. Verifique os dados ou fale com o administrador.",
        },
        { status: 404 }
      );
    }

    // Gerar token seguro de uso único (1 hora de validade)
    const token = await createPasswordResetToken(trainer.email);

    // Obter URL base da requisição
    const host =
      req.headers.get("x-forwarded-host") || req.headers.get("host") || "localhost:3000";
    const proto =
      req.headers.get("x-forwarded-proto") || (host.includes("localhost") ? "http" : "https");
    const baseUrl = `${proto}://${host}`;
    const resetUrl = `${baseUrl}/redefinir-senha?token=${token}`;

    // Disparar e-mail em segundo plano caso serviço esteja ativo
    sendPasswordResetEmail(trainer.email, token, baseUrl).catch(() => {});

    // Preparar dados do WhatsApp
    let targetPhone = "";
    let maskedPhone = "";

    if (trainer.phone) {
      const rawDigits = trainer.phone.replace(/\D/g, "");
      if (rawDigits.length >= 10) {
        targetPhone = rawDigits.startsWith("55") ? rawDigits : `55${rawDigits}`;
        const last4 = rawDigits.slice(-4);
        const ddd = rawDigits.length >= 12 ? rawDigits.slice(2, 4) : rawDigits.slice(0, 2);
        maskedPhone = `(${ddd}) 9****-${last4}`;
      }
    }

    return NextResponse.json({
      success: true,
      trainerName: trainer.name,
      email: trainer.email,
      hasWhatsApp: Boolean(targetPhone),
      phone: targetPhone,
      maskedPhone: maskedPhone || "WhatsApp cadastrado",
      resetUrl,
      message: "Link de recuperação gerado com sucesso!",
    });
  } catch (error) {
    console.error("Erro na rota forgot-password:", error);
    return NextResponse.json(
      { error: "Ocorreu um erro ao processar a solicitação. Tente novamente." },
      { status: 500 }
    );
  }
}
