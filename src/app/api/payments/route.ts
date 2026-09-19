import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const month = url.searchParams.get("month"); // formato MM/YYYY
    const status = url.searchParams.get("status"); // ALL, PAID, PENDING, OVERDUE
    const studentId = url.searchParams.get("studentId");

    const whereClause: {
      referenceMonth?: string;
      status?: string;
      studentId?: string;
    } = {};

    if (month && month !== "ALL") {
      whereClause.referenceMonth = month;
    }

    if (status && status !== "ALL") {
      whereClause.status = status;
    }

    if (studentId) {
      whereClause.studentId = studentId;
    }

    const payments = await prisma.payment.findMany({
      where: whereClause,
      include: {
        student: {
          select: {
            id: true,
            name: true,
            phone: true,
            monthlyFee: true,
            dueDay: true,
          },
        },
      },
      orderBy: { dueDate: "asc" },
    });

    // Calcular resumo
    let totalPaid = 0;
    let totalPending = 0;
    let totalOverdue = 0;

    const now = new Date();
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;

    // Atualizar dinamicamente se estiver atrasado
    const updatedPayments = payments.map((p) => {
      let currentStatus = p.status;
      if (currentStatus === "PAID") {
        totalPaid += p.amount;
      } else {
        totalPending += p.amount;
        if (p.dueDate < todayStr) {
          currentStatus = "OVERDUE";
          totalOverdue += p.amount;
        }
      }
      return { ...p, calculatedStatus: currentStatus };
    });

    return NextResponse.json({
      payments: updatedPayments,
      summary: {
        totalBilled: totalPaid + totalPending,
        totalPaid,
        totalPending,
        totalOverdue,
      },
    });
  } catch (error) {
    console.error("Erro ao listar pagamentos:", error);
    return NextResponse.json({ error: "Erro ao buscar pagamentos" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const data = await req.json();

    if (!data.studentId || !data.amount || !data.dueDate) {
      return NextResponse.json(
        { error: "Aluno, valor e data de vencimento são obrigatórios" },
        { status: 400 }
      );
    }

    const now = new Date();
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;

    // Determinar mês de referência caso não enviado
    let refMonth = data.referenceMonth;
    if (!refMonth) {
      const parts = data.dueDate.split("-");
      if (parts.length === 3) {
        refMonth = `${parts[1]}/${parts[0]}`;
      } else {
        refMonth = `${String(now.getMonth() + 1).padStart(2, "0")}/${now.getFullYear()}`;
      }
    }

    const payment = await prisma.payment.create({
      data: {
        studentId: data.studentId,
        amount: parseFloat(data.amount),
        referenceMonth: refMonth,
        dueDate: data.dueDate,
        paidAt: data.status === "PAID" ? (data.paidAt || todayStr) : null,
        status: data.status || "PENDING",
        paymentMethod: data.paymentMethod || "PIX",
        notes: data.notes?.trim() || null,
      },
      include: {
        student: {
          select: { id: true, name: true, phone: true },
        },
      },
    });

    return NextResponse.json(payment, { status: 201 });
  } catch (error) {
    console.error("Erro ao criar pagamento:", error);
    return NextResponse.json({ error: "Erro ao salvar cobrança" }, { status: 500 });
  }
}
