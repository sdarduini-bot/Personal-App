import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { randomUUID } from "crypto";
import { getTrainerSession } from "@/lib/auth-trainer";

export async function GET(req: Request) {
  try {
    const trainer = await getTrainerSession();
    if (!trainer) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const url = new URL(req.url);
    const studentId = url.searchParams.get("studentId");

    const whereClause: any = {
      student: { trainerId: trainer.id },
    };
    if (studentId) whereClause.studentId = studentId;

    const plans = await prisma.workoutPlan.findMany({
      where: whereClause,
      include: {
        student: { select: { id: true, name: true, phone: true } },
        exercises: { orderBy: { order: "asc" } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(plans);
  } catch (error) {
    console.error("Erro ao listar treinos:", error);
    return NextResponse.json({ error: "Erro ao buscar planos de treino" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const trainer = await getTrainerSession();
    if (!trainer) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const data = await req.json();

    if (!data.studentId || !data.title) {
      return NextResponse.json(
        { error: "Aluno e título do plano são obrigatórios" },
        { status: 400 }
      );
    }

    const student = await prisma.student.findFirst({
      where: { id: data.studentId, trainerId: trainer.id },
    });

    if (!student) {
      return NextResponse.json({ error: "Aluno não encontrado" }, { status: 404 });
    }

    const shareToken = `treino-${randomUUID().substring(0, 8)}`;

    const exercises = Array.isArray(data.exercises) ? data.exercises : [];

    const plan = await prisma.workoutPlan.create({
      data: {
        studentId: data.studentId,
        title: data.title.trim(),
        goal: data.goal?.trim() || null,
        notes: data.notes?.trim() || null,
        shareToken,
        exercises: {
          create: exercises.map((ex: {
            name: string;
            sets: string;
            reps: string;
            load?: string;
            restSeconds?: number;
            notes?: string;
          }, index: number) => ({
            order: index + 1,
            name: ex.name.trim(),
            sets: String(ex.sets || "3"),
            reps: String(ex.reps || "10-12"),
            load: ex.load?.trim() || null,
            restSeconds: parseInt(String(ex.restSeconds)) || 60,
            notes: ex.notes?.trim() || null,
          })),
        },
      },
      include: {
        student: { select: { id: true, name: true, phone: true } },
        exercises: { orderBy: { order: "asc" } },
      },
    });

    return NextResponse.json(plan, { status: 201 });
  } catch (error) {
    console.error("Erro ao criar plano de treino:", error);
    return NextResponse.json({ error: "Erro ao salvar plano de treino" }, { status: 500 });
  }
}
