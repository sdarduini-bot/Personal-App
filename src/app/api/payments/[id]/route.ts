import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const data = await req.json();

    const payment = await prisma.payment.update({
      where: { id: params.id },
      data: {
        amount: data.amount !== undefined ? parseFloat(data.amount) : undefined,
        dueDate: data.dueDate,
        paidAt: data.paidAt,
        status: data.status,
        paymentMethod: data.paymentMethod,
        referenceMonth: data.referenceMonth,
        notes: data.notes?.trim() || null,
      },
      include: {
        student: { select: { id: true, name: true, phone: true } },
      },
    });

    return NextResponse.json(payment);
  } catch (error) {
    console.error("Erro ao atualizar pagamento:", error);
    return NextResponse.json({ error: "Erro ao atualizar pagamento" }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.payment.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true, message: "Pagamento excluído com sucesso" });
  } catch (error) {
    console.error("Erro ao deletar pagamento:", error);
    return NextResponse.json({ error: "Erro ao excluir cobrança" }, { status: 500 });
  }
}
