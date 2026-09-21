import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getTrainerSession } from "@/lib/auth-trainer";

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const trainer = await getTrainerSession();
    if (!trainer) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const plan = await prisma.workoutPlan.findFirst({
      where: {
        id: params.id,
        student: { trainerId: trainer.id },
      },
      include: {
        student: true,
        exercises: { orderBy: { order: "asc" } },
      },
    });

    if (!plan) {
      return NextResponse.json({ error: "Plano não encontrado" }, { status: 404 });
    }

    return NextResponse.json(plan);
  } catch (error) {
    return NextResponse.json({ error: "Erro ao buscar plano" }, { status: 500 });
  }
}

export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const trainer = await getTrainerSession();
    if (!trainer) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const existing = await prisma.workoutPlan.findFirst({
      where: {
        id: params.id,
        student: { trainerId: trainer.id },
      },
    });

    if (!existing) {
      return NextResponse.json({ error: "Plano não encontrado" }, { status: 404 });
    }

    const data = await req.json();

    // Se novos exercícios forem enviados, substituir na transação
    if (data.exercises && Array.isArray(data.exercises)) {
      await prisma.workoutExercise.deleteMany({
        where: { workoutPlanId: params.id },
      });

      await prisma.workoutExercise.createMany({
        data: data.exercises.map((ex: {
          name: string;
          sets: string;
          reps: string;
          load?: string;
          restSeconds?: number;
          notes?: string;
        }, index: number) => ({
          workoutPlanId: params.id,
          order: index + 1,
          name: ex.name.trim(),
          sets: String(ex.sets || "3"),
          reps: String(ex.reps || "10-12"),
          load: ex.load?.trim() || null,
          restSeconds: parseInt(String(ex.restSeconds)) || 60,
          notes: ex.notes?.trim() || null,
        })),
      });
    }

    const updated = await prisma.workoutPlan.update({
      where: { id: params.id },
      data: {
        title: data.title?.trim(),
        goal: data.goal?.trim() || null,
        notes: data.notes?.trim() || null,
        studentId: data.studentId,
      },
      include: {
        student: { select: { id: true, name: true, phone: true } },
        exercises: { orderBy: { order: "asc" } },
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Erro ao atualizar plano de treino:", error);
    return NextResponse.json({ error: "Erro ao atualizar treino" }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const trainer = await getTrainerSession();
    if (!trainer) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const existing = await prisma.workoutPlan.findFirst({
      where: {
        id: params.id,
        student: { trainerId: trainer.id },
      },
    });

    if (!existing) {
      return NextResponse.json({ error: "Plano não encontrado" }, { status: 404 });
    }

    await prisma.workoutPlan.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true, message: "Plano de treino excluído" });
  } catch (error) {
    console.error("Erro ao excluir treino:", error);
    return NextResponse.json({ error: "Erro ao excluir treino" }, { status: 500 });
  }
}
