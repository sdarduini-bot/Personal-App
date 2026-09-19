import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const payment = await prisma.payment.findUnique({
      where: { id: params.id },
    });

    if (!payment) {
      return NextResponse.json({ error: "Pagamento não encontrado" }, { status: 404 });
    }

    const now = new Date();
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;

    const newStatus = payment.status === "PAID" ? "PENDING" : "PAID";
    const newPaidAt = newStatus === "PAID" ? todayStr : null;

    const updated = await prisma.payment.update({
      where: { id: params.id },
      data: {
        status: newStatus,
        paidAt: newPaidAt,
      },
      include: {
        student: { select: { id: true, name: true, phone: true } },
      },
    });

    return NextResponse.json({
      success: true,
      payment: updated,
      message: newStatus === "PAID" ? "Pagamento marcado como recebido!" : "Pagamento marcado como pendente.",
    });
  } catch (error) {
    console.error("Erro ao alterar status:", error);
    return NextResponse.json({ error: "Erro ao alternar status do pagamento" }, { status: 500 });
  }
}
