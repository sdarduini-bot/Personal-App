import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword, getTrainerSession } from "@/lib/auth-trainer";
import { hashPin } from "@/lib/auth-security";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const trainerSession = await getTrainerSession();
    if (!trainerSession) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const trainer = await prisma.trainer.findUnique({
      where: { id: trainerSession.id },
    });

    if (!trainer) {
      return NextResponse.json({ error: "Treinador não encontrado" }, { status: 404 });
    }

    return NextResponse.json({
      id: trainer.id,
      name: trainer.name,
      email: trainer.email,
      phone: trainer.phone || "",
      pixKey: trainer.pixKey || "",
      bio: trainer.bio || "",
      themePreference: trainer.themePreference || "emerald",
      subscriptionStatus: trainer.subscriptionStatus,
      trialEndsAt: trainer.trialEndsAt,
    });
  } catch (error) {
    console.error("Erro ao buscar configurações:", error);
    return NextResponse.json({ error: "Erro ao buscar configurações" }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const trainerSession = await getTrainerSession();
    if (!trainerSession) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const data = await req.json();

    const updateData: {
      name?: string;
      phone?: string;
      pixKey?: string;
      bio?: string;
      passwordHash?: string;
      themePreference?: string;
    } = {};

    if (data.name !== undefined) updateData.name = data.name;
    if (data.phone !== undefined) updateData.phone = data.phone;
    if (data.pixKey !== undefined) updateData.pixKey = data.pixKey;
    if (data.bio !== undefined) updateData.bio = data.bio;
    if (data.themePreference !== undefined) updateData.themePreference = data.themePreference;

    if (data.newPassword && data.newPassword.trim().length >= 4) {
      updateData.passwordHash = hashPassword(data.newPassword.trim());
    } else if (data.newPin && data.newPin.trim().length >= 4) {
      updateData.passwordHash = hashPassword(data.newPin.trim());
    }

    const updated = await prisma.trainer.update({
      where: { id: trainerSession.id },
      data: updateData,
    });

    // Se for o Pedro, sincroniza com TrainerSettings legado por compatibilidade
    if (trainerSession.id === "trainer_pedro") {
      try {
        await prisma.trainerSettings.upsert({
          where: { id: "trainer" },
          update: {
            name: updated.name,
            phone: updated.phone,
            pixKey: updated.pixKey,
            bio: updated.bio,
            themePreference: updated.themePreference,
            ...(data.newPin ? { pin: hashPin(data.newPin.trim()) } : {}),
          },
          create: {
            id: "trainer",
            name: updated.name,
            pin: data.newPin ? hashPin(data.newPin.trim()) : hashPin("1234"),
            phone: updated.phone,
            pixKey: updated.pixKey,
            bio: updated.bio,
            themePreference: updated.themePreference,
          },
        });
      } catch (e) {
        console.warn("Aviso: Sincronização legada opcional não aplicada", e);
      }
    }

    return NextResponse.json({
      success: true,
      trainer: {
        id: updated.id,
        name: updated.name,
        email: updated.email,
        phone: updated.phone,
        pixKey: updated.pixKey,
        bio: updated.bio,
        themePreference: updated.themePreference,
        subscriptionStatus: updated.subscriptionStatus,
        trialEndsAt: updated.trialEndsAt,
      },
    });
  } catch (error) {
    console.error("Erro ao atualizar configurações:", error);
    return NextResponse.json({ error: "Erro ao salvar configurações" }, { status: 500 });
  }
}
