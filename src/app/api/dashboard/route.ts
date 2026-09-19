import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const dateParam = url.searchParams.get("date");

    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonthNum = String(now.getMonth() + 1).padStart(2, "0");
    const currentDayNum = String(now.getDate()).padStart(2, "0");

    const todayStr = dateParam || `${currentYear}-${currentMonthNum}-${currentDayNum}`;
    const currentMonthRef = `${currentMonthNum}/${currentYear}`;

    // Executar todas as consultas em paralelo para máxima performance
    const [
      totalStudents,
      todayClasses,
      monthPayments,
      pastOverdue,
      recentStudents,
    ] = await Promise.all([
      // 1. Total de alunos ativos
      prisma.student.count({
        where: { status: "ACTIVE" },
      }),

      // 2. Aulas de hoje com projeção restrita de campos
      prisma.classSchedule.findMany({
        where: { date: todayStr },
        select: {
          id: true,
          title: true,
          startTime: true,
          endTime: true,
          location: true,
          status: true,
          notes: true,
          student: {
            select: { id: true, name: true, phone: true, avatarUrl: true },
          },
        },
        orderBy: { startTime: "asc" },
      }),

      // 3. Pagamentos do mês
      prisma.payment.findMany({
        where: { referenceMonth: currentMonthRef },
        select: {
          id: true,
          amount: true,
          dueDate: true,
          status: true,
          referenceMonth: true,
          student: {
            select: { id: true, name: true, phone: true },
          },
        },
        orderBy: { dueDate: "asc" },
      }),

      // 4. Pagamentos vencidos de meses anteriores
      prisma.payment.findMany({
        where: {
          status: { in: ["OVERDUE", "PENDING"] },
          referenceMonth: { not: currentMonthRef },
          dueDate: { lt: todayStr },
        },
        select: {
          id: true,
          amount: true,
          dueDate: true,
          status: true,
          referenceMonth: true,
          student: {
            select: { id: true, name: true, phone: true },
          },
        },
        take: 10,
      }),

      // 5. Últimos alunos cadastrados
      prisma.student.findMany({
        where: { status: "ACTIVE" },
        orderBy: { createdAt: "desc" },
        take: 5,
        select: {
          id: true,
          name: true,
          goal: true,
          phone: true,
          planName: true,
          monthlyFee: true,
        },
      }),
    ]);

    let monthRevenuePaid = 0;
    let monthRevenuePending = 0;
    const overdueAlerts: Array<{
      id: string;
      studentName: string;
      studentPhone: string;
      amount: number;
      dueDate: string;
      status: string;
      referenceMonth: string;
    }> = [];

    monthPayments.forEach((p) => {
      if (p.status === "PAID") {
        monthRevenuePaid += p.amount;
      } else {
        monthRevenuePending += p.amount;
        if (p.status === "OVERDUE" || p.dueDate < todayStr) {
          overdueAlerts.push({
            id: p.id,
            studentName: p.student.name,
            studentPhone: p.student.phone,
            amount: p.amount,
            dueDate: p.dueDate,
            status: "OVERDUE",
            referenceMonth: p.referenceMonth,
          });
        }
      }
    });

    pastOverdue.forEach((p) => {
      overdueAlerts.push({
        id: p.id,
        studentName: p.student.name,
        studentPhone: p.student.phone,
        amount: p.amount,
        dueDate: p.dueDate,
        status: "OVERDUE",
        referenceMonth: p.referenceMonth,
      });
    });

    return NextResponse.json({
      todayStr,
      currentMonthRef,
      metrics: {
        totalStudents,
        todayClassesCount: todayClasses.length,
        todayCompletedCount: todayClasses.filter((c) => c.status === "COMPLETED").length,
        monthRevenuePaid,
        monthRevenuePending,
        overdueCount: overdueAlerts.length,
      },
      todayClasses,
      overdueAlerts,
      recentStudents,
    });
  } catch (error) {
    console.error("Erro no dashboard:", error);
    return NextResponse.json({ error: "Erro ao carregar dados do dashboard" }, { status: 500 });
  }
}
