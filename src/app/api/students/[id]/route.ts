import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const student = await prisma.student.findUnique({
      where: { id: params.id },
    });

    if (!student) {
      return NextResponse.json({ error: "Aluno não encontrado" }, { status: 404 });
    }

    return NextResponse.json(student);
  } catch (error) {
    return NextResponse.json({ error: "Erro ao buscar aluno" }, { status: 500 });
  }
}

export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const data = await req.json();

    const student = await prisma.student.update({
      where: { id: params.id },
      data: {
        name: data.name?.trim(),
        phone: data.phone?.trim(),
        email: data.email?.trim() || null,
        birthDate: data.birthDate || null,
        goal: data.goal?.trim(),
        planName: data.planName?.trim(),
        billingType: data.billingType,
        frequency: data.frequency,
        pricePerSession: data.pricePerSession !== undefined ? parseFloat(data.pricePerSession) : undefined,
        paymentTiming: data.paymentTiming,
        packageTotalClasses: data.packageTotalClasses !== undefined ? (data.packageTotalClasses ? parseInt(data.packageTotalClasses) : null) : undefined,
        packageRemainingClasses: data.packageRemainingClasses !== undefined ? (data.packageRemainingClasses ? parseInt(data.packageRemainingClasses) : null) : undefined,
        monthlyFee: data.monthlyFee !== undefined ? parseFloat(data.monthlyFee) : undefined,
        dueDay: data.dueDay !== undefined ? parseInt(data.dueDay) : undefined,
        startDate: data.startDate,
        status: data.status,
        notes: data.notes?.trim() || null,
        avatarUrl: data.avatarUrl || null,
      },
    });

    return NextResponse.json(student);
  } catch (error) {
    console.error("Erro ao atualizar aluno:", error);
    return NextResponse.json({ error: "Erro ao atualizar aluno" }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.student.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true, message: "Aluno removido com sucesso" });
  } catch (error) {
    console.error("Erro ao excluir aluno:", error);
    return NextResponse.json({ error: "Erro ao excluir aluno" }, { status: 500 });
  }
}
