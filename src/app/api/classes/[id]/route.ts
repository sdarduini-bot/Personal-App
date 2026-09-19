import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { bookingMutex } from "@/lib/mutex";

export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const data = await req.json();

    return await bookingMutex.runExclusive(async () => {
      // Validação de Choque de Horários (Overlap)
      if (data.date && data.startTime && data.endTime && !data.allowOverlap) {
        const conflict = await prisma.classSchedule.findFirst({
          where: {
            id: { not: params.id },
            date: data.date,
            status: { not: "CANCELED" },
            AND: [
              { startTime: { lt: data.endTime } },
              { endTime: { gt: data.startTime } },
            ],
          },
          include: {
            student: { select: { id: true, name: true, phone: true } },
          },
        });

        if (conflict) {
          return NextResponse.json(
            {
              error: `Choque de horário com o aluno ${conflict.student.name} (${conflict.startTime} às ${conflict.endTime}).`,
              conflictWith: conflict.student.name,
              conflictTime: `${conflict.startTime} às ${conflict.endTime}`,
              conflictClassId: conflict.id,
            },
            { status: 409 }
          );
        }
      }

      const updated = await prisma.classSchedule.update({
        where: { id: params.id },
        data: {
          title: data.title !== undefined ? (data.title?.trim() || null) : undefined,
          date: data.date,
          startTime: data.startTime,
          endTime: data.endTime,
          location: data.location,
          status: data.status,
          notes: data.notes !== undefined ? (data.notes?.trim() || null) : undefined,
        },
        include: {
          student: { select: { id: true, name: true, phone: true } },
        },
      });

      return NextResponse.json(updated);
    });
  } catch (error) {
    console.error("Erro ao editar aula:", error);
    return NextResponse.json({ error: "Erro ao atualizar aula" }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.classSchedule.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true, message: "Aula desmarcada com sucesso" });
  } catch (error) {
    console.error("Erro ao excluir aula:", error);
    return NextResponse.json({ error: "Erro ao excluir aula" }, { status: 500 });
  }
}
