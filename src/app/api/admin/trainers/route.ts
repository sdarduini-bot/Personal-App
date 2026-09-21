import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAdminSession, hashPassword } from "@/lib/auth-trainer";

export const dynamic = "force-dynamic";

/**
 * GET: Listar todos os treinadores cadastrados na plataforma (Apenas Admin)
 */
export async function GET() {
  try {
    const isAdmin = await isAdminSession();
    if (!isAdmin) {
      return NextResponse.json({ error: "Acesso restrito ao administrador." }, { status: 403 });
    }

    const trainers = await prisma.trainer.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        isActive: true,
        createdAt: true,
        _count: {
          select: {
            students: true,
            classes: true,
          },
        },
      },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json(trainers);
  } catch (error) {
    console.error("Erro ao listar treinadores (admin):", error);
    return NextResponse.json({ error: "Erro ao buscar treinadores." }, { status: 500 });
  }
}

/**
 * POST: Cadastrar novo treinador de teste (Apenas Admin)
 */
export async function POST(req: Request) {
  try {
    const isAdmin = await isAdminSession();
    if (!isAdmin) {
      return NextResponse.json({ error: "Acesso restrito ao administrador." }, { status: 403 });
    }

    const body = await req.json();
    const { name, email, phone, password } = body;

    if (!name || !name.trim()) {
      return NextResponse.json({ error: "Nome do treinador é obrigatório." }, { status: 400 });
    }

    if (!email || !email.includes("@")) {
      return NextResponse.json({ error: "E-mail válido é obrigatório." }, { status: 400 });
    }

    if (!password || password.trim().length < 4) {
      return NextResponse.json(
        { error: "A senha inicial deve ter no mínimo 4 caracteres." },
        { status: 400 }
      );
    }

    const cleanEmail = email.toLowerCase().trim();

    // Verificar se já existe
    const existing = await prisma.trainer.findUnique({
      where: { email: cleanEmail },
    });

    if (existing) {
      return NextResponse.json(
        { error: "Já existe uma conta cadastrada com este e-mail." },
        { status: 409 }
      );
    }

    const newTrainer = await prisma.trainer.create({
      data: {
        name: name.trim(),
        email: cleanEmail,
        passwordHash: hashPassword(password),
        phone: phone ? phone.trim() : null,
        pixKey: cleanEmail,
        bio: "Personal Trainer",
        role: "TRAINER",
        isActive: true,
        subscriptionStatus: "ACTIVE",
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
    });

    return NextResponse.json(
      { success: true, message: "Treinador cadastrado com sucesso!", trainer: newTrainer },
      { status: 201 }
    );
  } catch (error) {
    console.error("Erro ao cadastrar treinador (admin):", error);
    return NextResponse.json({ error: "Erro ao criar conta de treinador." }, { status: 500 });
  }
}

/**
 * PUT: Alterar status (Ativo/Inativo) ou Redefinir Senha do treinador (Apenas Admin)
 */
export async function PUT(req: Request) {
  try {
    const isAdmin = await isAdminSession();
    if (!isAdmin) {
      return NextResponse.json({ error: "Acesso restrito ao administrador." }, { status: 403 });
    }

    const body = await req.json();
    const { trainerId, isActive, newPassword, name, phone } = body;

    if (!trainerId) {
      return NextResponse.json({ error: "ID do treinador é obrigatório." }, { status: 400 });
    }

    const targetTrainer = await prisma.trainer.findUnique({
      where: { id: trainerId },
    });

    if (!targetTrainer) {
      return NextResponse.json({ error: "Treinador não encontrado." }, { status: 404 });
    }

    // Não permitir desativar a própria conta admin master
    if (targetTrainer.role === "ADMIN" && isActive === false) {
      return NextResponse.json(
        { error: "Não é permitido desativar a conta do Administrador Mestre." },
        { status: 400 }
      );
    }

    const updateData: {
      isActive?: boolean;
      passwordHash?: string;
      name?: string;
      phone?: string;
    } = {};

    if (typeof isActive === "boolean") {
      updateData.isActive = isActive;
    }

    if (newPassword && newPassword.trim().length >= 4) {
      updateData.passwordHash = hashPassword(newPassword.trim());
    }

    if (name && name.trim()) {
      updateData.name = name.trim();
    }

    if (phone !== undefined) {
      updateData.phone = phone.trim();
    }

    const updated = await prisma.trainer.update({
      where: { id: trainerId },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        isActive: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Dados do treinador atualizados com sucesso!",
      trainer: updated,
    });
  } catch (error) {
    console.error("Erro ao atualizar treinador (admin):", error);
    return NextResponse.json({ error: "Erro ao atualizar treinador." }, { status: 500 });
  }
}
