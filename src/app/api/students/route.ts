import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const search = url.searchParams.get("search") || "";
    const status = url.searchParams.get("status") || "ALL";

    const whereClause: {
      name?: { contains: string };
      status?: string;
    } = {};

    if (search.trim()) {
      whereClause.name = { contains: search.trim() };
    }

    if (status !== "ALL") {
      whereClause.status = status;
    }

    const now = new Date();
    const currentMonthRef = `${String(now.getMonth() + 1).padStart(2, "0")}/${now.getFullYear()}`;

    const students = await prisma.student.findMany({
      where: whereClause,
      include: {
        _count: {
          select: {
            classes: true,
            workoutPlans: true,
            payments: true,
          },
        },
        payments: {
          where: {
            referenceMonth: currentMonthRef,
          },
          select: {
            id: true,
            status: true,
            dueDate: true,
            amount: true,
          },
          take: 1,
        },
      },
      orderBy: { name: "asc" },
    });

    return NextResponse.json(students);
  } catch (error) {
    console.error("Erro ao listar alunos:", error);
    return NextResponse.json({ error: "Erro ao buscar alunos" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const data = await req.json();

    if (!data.name || !data.phone) {
      return NextResponse.json(
        { error: "Nome e telefone são obrigatórios" },
        { status: 400 }
      );
    }

    const now = new Date();
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;

    const billingType = data.billingType || "MONTHLY";
    const frequency = data.frequency || (billingType === "MONTHLY" ? "3x/sem" : null);
    const pricePerSession = data.pricePerSession !== undefined ? parseFloat(data.pricePerSession) : 90.0;
    const paymentTiming = data.paymentTiming || "POST_CLASS";
    const packageTotalClasses = data.packageTotalClasses ? parseInt(data.packageTotalClasses) : null;
    const packageRemainingClasses = packageTotalClasses;

    const student = await prisma.student.create({
      data: {
        name: data.name.trim(),
        phone: data.phone.trim(),
        email: data.email?.trim() || null,
        birthDate: data.birthDate || null,
        goal: data.goal?.trim() || "Hipertrofia",
        planName:
          data.planName?.trim() ||
          (billingType === "PER_CLASS"
            ? "Treino Avulso"
            : billingType === "PACKAGE"
            ? `Pacote ${packageTotalClasses || 10} Aulas`
            : "Mensalidade Padrão"),
        billingType,
        frequency,
        pricePerSession,
        paymentTiming,
        packageTotalClasses,
        packageRemainingClasses,
        monthlyFee: parseFloat(data.monthlyFee) || (billingType === "PER_CLASS" ? 0 : 300.0),
        dueDay: parseInt(data.dueDay) || 10,
        startDate: data.startDate || todayStr,
        status: data.status || "ACTIVE",
        notes: data.notes?.trim() || null,
        avatarUrl: data.avatarUrl || null,
      },
    });

    // Se solicitado gerar cobrança inicial
    if (data.createInitialPayment) {
      if (billingType === "MONTHLY") {
        const monthRef = `${String(now.getMonth() + 1).padStart(2, "0")}/${now.getFullYear()}`;
        const dueDayFormatted = String(student.dueDay).padStart(2, "0");
        const dueDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${dueDayFormatted}`;

        await prisma.payment.create({
          data: {
            studentId: student.id,
            amount: student.monthlyFee,
            referenceMonth: monthRef,
            dueDate: dueDate,
            status: "PENDING",
            paymentMethod: "PIX",
            notes: `Mensalidade inicial (${frequency || "Mensal"})`,
          },
        });
      } else if (billingType === "PACKAGE") {
        const packageAmount =
          parseFloat(data.packageTotalValue) ||
          student.monthlyFee ||
          (packageTotalClasses ? packageTotalClasses * (pricePerSession || 80) : 800);

        await prisma.payment.create({
          data: {
            studentId: student.id,
            amount: packageAmount,
            referenceMonth: `Pacote ${packageTotalClasses || 10} Aulas`,
            dueDate: todayStr,
            status: "PENDING",
            paymentMethod: "PIX",
            notes: `Contratação de pacote com ${packageTotalClasses || 10} sessões`,
          },
        });
      } else if (billingType === "PER_CLASS" && paymentTiming === "PRE_CLASS") {
        await prisma.payment.create({
          data: {
            studentId: student.id,
            amount: pricePerSession,
            referenceMonth: `1º Treino Avulso`,
            dueDate: todayStr,
            status: "PENDING",
            paymentMethod: "PIX",
            notes: `Cobrança antecipada para confirmação do 1º treino`,
          },
        });
      }
    }

    return NextResponse.json(student, { status: 201 });
  } catch (error) {
    console.error("Erro ao criar aluno:", error);
    return NextResponse.json({ error: "Erro ao salvar aluno" }, { status: 500 });
  }
}
