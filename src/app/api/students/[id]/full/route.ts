import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const student = await prisma.student.findUnique({
      where: { id: params.id },
      include: {
        payments: {
          orderBy: { dueDate: "desc" },
        },
        classes: {
          orderBy: { date: "desc" },
        },
        workoutPlans: {
          include: {
            exercises: {
              orderBy: { order: "asc" },
            },
          },
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!student) {
      return NextResponse.json({ error: "Aluno não encontrado" }, { status: 404 });
    }

    // Calcular estatísticas rápidas do aluno
    const totalPaid = student.payments
      .filter((p) => p.status === "PAID")
      .reduce((sum, p) => sum + p.amount, 0);

    const pendingPayments = student.payments.filter((p) => p.status !== "PAID");
    const totalPending = pendingPayments.reduce((sum, p) => sum + p.amount, 0);

    const completedClasses = student.classes.filter((c) => c.status === "COMPLETED").length;
    const scheduledClasses = student.classes.filter((c) => c.status === "SCHEDULED").length;

    return NextResponse.json({
      ...student,
      stats: {
        totalPaid,
        totalPending,
        hasPendingPayment: pendingPayments.length > 0,
        completedClasses,
        scheduledClasses,
        totalWorkoutPlans: student.workoutPlans.length,
      },
    });
  } catch (error) {
    console.error("Erro ao carregar perfil completo:", error);
    return NextResponse.json({ error: "Erro interno ao buscar perfil" }, { status: 500 });
  }
}
