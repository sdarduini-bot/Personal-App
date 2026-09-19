import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const { referenceMonth } = await req.json();

    if (!referenceMonth || !referenceMonth.includes("/")) {
      return NextResponse.json(
        { error: "Mês de referência inválido (formato esperado: MM/AAAA)" },
        { status: 400 }
      );
    }

    const [monthStr, yearStr] = referenceMonth.split("/");
    const activeStudents = await prisma.student.findMany({
      where: {
        status: "ACTIVE",
        billingType: "MONTHLY",
      },
      include: {
        payments: {
          where: { referenceMonth },
        },
      },
    });

    let createdCount = 0;
    const skippedCount = activeStudents.filter((s) => s.payments.length > 0).length;

    for (const student of activeStudents) {
      // Se já tem cobrança para este mês, não duplica
      if (student.payments.length > 0) continue;

      const dueDayFormatted = String(student.dueDay).padStart(2, "0");
      const dueDate = `${yearStr}-${monthStr}-${dueDayFormatted}`;

      await prisma.payment.create({
        data: {
          studentId: student.id,
          amount: student.monthlyFee,
          referenceMonth,
          dueDate,
          status: "PENDING",
          paymentMethod: "PIX",
          notes: `Mensalidade gerada automaticamente para ${referenceMonth}`,
        },
      });

      createdCount++;
    }

    return NextResponse.json({
      success: true,
      createdCount,
      skippedCount,
      message: `${createdCount} mensalidades geradas com sucesso para ${referenceMonth}! (${skippedCount} já existiam).`,
    });
  } catch (error) {
    console.error("Erro ao gerar mensalidades do mês:", error);
    return NextResponse.json({ error: "Erro ao gerar faturas do mês" }, { status: 500 });
  }
}
