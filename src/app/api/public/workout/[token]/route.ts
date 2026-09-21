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
            trainer: {
              select: {
                name: true,
                phone: true,
                bio: true,
              },
            },
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

    const trainer = plan.student?.trainer || {
      name: "Personal Trainer",
      phone: "",
      bio: "",
    };

    return NextResponse.json({
      plan,
      trainer,
    });
  } catch (error) {
    console.error("Erro ao buscar plano público:", error);
    return NextResponse.json({ error: "Erro ao carregar treino" }, { status: 500 });
  }
}
