import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { addWeeks, format } from "date-fns";
import { bookingMutex } from "@/lib/mutex";
import { getTrainerSession } from "@/lib/auth-trainer";

export async function GET(req: Request) {
  try {
    const trainer = await getTrainerSession();
    if (!trainer) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const url = new URL(req.url);
    const date = url.searchParams.get("date");
    const startDate = url.searchParams.get("startDate");
    const endDate = url.searchParams.get("endDate");
    const studentId = url.searchParams.get("studentId");
    const status = url.searchParams.get("status");

    const whereClause: {
      trainerId?: string;
      date?: string | { gte?: string; lte?: string };
      studentId?: string;
      status?: string;
      student?: { trainerId: string };
    } = {
      student: { trainerId: trainer.id },
    };

    if (date) {
      whereClause.date = date;
    } else if (startDate && endDate) {
      whereClause.date = {
        gte: startDate,
        lte: endDate,
      };
    }

    if (studentId) {
      whereClause.studentId = studentId;
    }

    if (status && status !== "ALL") {
      whereClause.status = status;
    }

    const classes = await prisma.classSchedule.findMany({
      where: whereClause,
      include: {
        student: {
          select: {
            id: true,
            name: true,
            phone: true,
            avatarUrl: true,
          },
        },
      },
      orderBy: [{ date: "asc" }, { startTime: "asc" }],
    });

    return NextResponse.json(classes);
  } catch (error) {
    console.error("Erro ao listar agenda de aulas:", error);
    return NextResponse.json({ error: "Erro ao buscar agenda" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const trainer = await getTrainerSession();
    if (!trainer) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const data = await req.json();

    if (!data.studentId || !data.date || !data.startTime) {
      return NextResponse.json(
        { error: "Aluno, data e horário de início são obrigatórios" },
        { status: 400 }
      );
    }

    // Verificar se o aluno pertence a este treinador
    const student = await prisma.student.findFirst({
      where: { id: data.studentId, trainerId: trainer.id },
    });

    if (!student) {
      return NextResponse.json({ error: "Aluno não encontrado ou não pertence a você" }, { status: 404 });
    }

    // Calcular horário de fim padrão (1 hora depois se não informado)
    let endTime = data.endTime;
    if (!endTime) {
      const [h, m] = data.startTime.split(":").map(Number);
      const endH = String((h + 1) % 24).padStart(2, "0");
      endTime = `${endH}:${String(m).padStart(2, "0")}`;
    }

    return await bookingMutex.runExclusive(async () => {
      // Validação de Choque de Horários (Overlap) estritamente para o professor logado
      if (!data.allowOverlap) {
        const conflict = await prisma.classSchedule.findFirst({
          where: {
            date: data.date,
            status: { not: "CANCELED" },
            student: { trainerId: trainer.id },
            AND: [
              { startTime: { lt: endTime } },
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
              error: `Choque de horário com o aluno ${conflict.student.name} (${conflict.startTime} às ${conflict.endTime}). Ative "Treino em Conjunto" se for intencional.`,
              conflictWith: conflict.student.name,
              conflictTime: `${conflict.startTime} às ${conflict.endTime}`,
              conflictClassId: conflict.id,
              isOverlap: true,
            },
            { status: 409 }
          );
        }
      }

      const recurringWeeks = parseInt(data.recurringWeeks) || 1;

      if (recurringWeeks > 1) {
        const recurringGroupId = `rec_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
        const baseDate = new Date(`${data.date}T12:00:00`);
        const createdClasses = [];

        for (let i = 0; i < recurringWeeks; i++) {
          const nextDate = addWeeks(baseDate, i);
          const dateStr = format(nextDate, "yyyy-MM-dd");

          const cls = await prisma.classSchedule.create({
            data: {
              trainerId: trainer.id,
              studentId: data.studentId,
              title: data.title?.trim() || null,
              date: dateStr,
              startTime: data.startTime,
              endTime: endTime,
              location: data.location || "ACADEMIA",
              status: "SCHEDULED",
              notes: data.notes?.trim() || null,
              recurringGroupId,
            },
            include: {
              student: { select: { id: true, name: true, phone: true } },
            },
          });
          createdClasses.push(cls);
        }

        return NextResponse.json(
          {
            success: true,
            count: createdClasses.length,
            classes: createdClasses,
            message: `${createdClasses.length} aulas agendadas com sucesso nas próximas semanas!`,
          },
          { status: 201 }
        );
      }

      // Aula única
      const singleClass = await prisma.classSchedule.create({
        data: {
          trainerId: trainer.id,
          studentId: data.studentId,
          title: data.title?.trim() || null,
          date: data.date,
          startTime: data.startTime,
          endTime: endTime,
          location: data.location || "ACADEMIA",
          status: data.status || "SCHEDULED",
          notes: data.notes?.trim() || null,
        },
        include: {
          student: { select: { id: true, name: true, phone: true } },
        },
      });

      return NextResponse.json(singleClass, { status: 201 });
    });
  } catch (error) {
    console.error("Erro ao agendar aula:", error);
    return NextResponse.json({ error: "Erro ao agendar aula" }, { status: 500 });
  }
}
