import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getTrainerSession } from "@/lib/auth-trainer";

export async function POST(req: Request) {
  try {
    const trainer = await getTrainerSession();
    if (!trainer) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const { date, startTime, endTime, excludeClassId } = await req.json();

    if (!date || !startTime || !endTime) {
      return NextResponse.json(
        { error: "Data, horário de início e término são obrigatórios" },
        { status: 400 }
      );
    }

    const whereClause: any = {
      date,
      status: { not: "CANCELED" },
      student: { trainerId: trainer.id },
      AND: [
        { startTime: { lt: endTime } },
        { endTime: { gt: startTime } },
      ],
    };

    if (excludeClassId) {
      whereClause.id = { not: excludeClassId };
    }

    const conflict = await prisma.classSchedule.findFirst({
      where: whereClause,
      include: {
        student: { select: { id: true, name: true, phone: true } },
      },
    });

    if (conflict) {
      return NextResponse.json({
        hasConflict: true,
        conflictClass: {
          id: conflict.id,
          studentName: conflict.student.name,
          startTime: conflict.startTime,
          endTime: conflict.endTime,
          location: conflict.location,
        },
      });
    }

    return NextResponse.json({ hasConflict: false, conflictClass: null });
  } catch (error) {
    console.error("Erro ao validar sobreposição de horário:", error);
    return NextResponse.json({ error: "Erro interno ao validar horário" }, { status: 500 });
  }
}
