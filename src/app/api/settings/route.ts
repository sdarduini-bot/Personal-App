import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPin } from "@/lib/auth-security";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const trainer = await prisma.trainerSettings.findUnique({
      where: { id: "trainer" },
    });
    return NextResponse.json({
      name: trainer?.name || "Pedro Personal",
      phone: trainer?.phone || "",
      pixKey: trainer?.pixKey || "",
      bio: trainer?.bio || "",
      themePreference: trainer?.themePreference || "dark",
    });
  } catch (error) {
    return NextResponse.json({ error: "Erro ao buscar configurações" }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const data = await req.json();

    const updateData: {
      name?: string;
      phone?: string;
      pixKey?: string;
      bio?: string;
      pin?: string;
      themePreference?: string;
    } = {};

    if (data.name !== undefined) updateData.name = data.name;
    if (data.phone !== undefined) updateData.phone = data.phone;
    if (data.pixKey !== undefined) updateData.pixKey = data.pixKey;
    if (data.bio !== undefined) updateData.bio = data.bio;
    if (data.themePreference !== undefined) updateData.themePreference = data.themePreference;
    if (data.newPin && data.newPin.trim().length >= 4) {
      updateData.pin = hashPin(data.newPin.trim());
    }

    const updated = await prisma.trainerSettings.upsert({
      where: { id: "trainer" },
      update: updateData,
      create: {
        id: "trainer",
        name: data.name || "Pedro Personal",
        pin: data.newPin ? hashPin(data.newPin.trim()) : hashPin("1234"),
        phone: data.phone || "",
        pixKey: data.pixKey || "",
        bio: data.bio || "",
        themePreference: data.themePreference || "dark",
      },
    });

    return NextResponse.json({
      success: true,
      trainer: {
        name: updated.name,
        phone: updated.phone,
        pixKey: updated.pixKey,
        bio: updated.bio,
        themePreference: updated.themePreference,
      },
    });
  } catch (error) {
    console.error("Erro ao atualizar configurações:", error);
    return NextResponse.json({ error: "Erro ao salvar configurações" }, { status: 500 });
  }
}
