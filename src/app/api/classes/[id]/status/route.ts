import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { status } = await req.json();

    if (!status || !["SCHEDULED", "COMPLETED", "CANCELLED", "NO_SHOW"].includes(status)) {
      return NextResponse.json({ error: "Status inválido" }, { status: 400 });
    }

    const updated = await prisma.classSchedule.update({
      where: { id: params.id },
      data: { status },
      include: {
        student: { select: { id: true, name: true, phone: true } },
      },
    });

    return NextResponse.json({
      success: true,
      class: updated,
      message: `Status da aula alterado para ${status}`,
    });
  } catch (error) {
    console.error("Erro ao alterar status da aula:", error);
    return NextResponse.json({ error: "Erro ao atualizar status" }, { status: 500 });
  }
}
