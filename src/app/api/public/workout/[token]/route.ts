import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: Request,
  { params }: { params: { token: string } }
) {
  try {
    const plan = await prisma.workoutPlan.findUnique({
      where: { shareToken: params.token },
      include: {
        student: {
          select: {
            id: true,
            name: true,
            goal: true,
          },
        },
        exercises: {
          orderBy: { order: "asc" },
        },
      },
    });

    if (!plan) {
      return NextResponse.json({ error: "Plano de treino não encontrado ou link expirado." }, { status: 404 });
    }

    const trainer = await prisma.trainerSettings.findUnique({
      where: { id: "trainer" },
      select: {
        name: true,
        phone: true,
        bio: true,
      },
    });

    return NextResponse.json({
      plan,
      trainer: trainer || { name: "Pedro Personal Trainer" },
    });
  } catch (error) {
    console.error("Erro ao buscar plano público:", error);
    return NextResponse.json({ error: "Erro ao carregar treino" }, { status: 500 });
  }
}
