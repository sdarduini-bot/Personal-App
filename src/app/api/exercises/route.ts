import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { DEFAULT_EXERCISES } from "@/lib/exercises-seed";
import { getTrainerSession } from "@/lib/auth-trainer";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category");
    const search = searchParams.get("search");

    const trainer = await getTrainerSession();

    // Se o banco estiver vazio, popula automaticamente com os 120+ exercícios padrão
    const totalCount = await prisma.exerciseCatalog.count();
    if (totalCount === 0) {
      await prisma.exerciseCatalog.createMany({
        data: DEFAULT_EXERCISES.map((ex) => ({
          name: ex.name,
          category: ex.category,
          muscleGroup: ex.muscleGroup || null,
          isCustom: false,
          trainerId: null,
        })),
      });
    }

    const where: any = {
      OR: [
        { trainerId: null },
        ...(trainer ? [{ trainerId: trainer.id }] : []),
      ],
    };

    if (category && category !== "Todos") {
      where.category = category;
    }

    if (search && search.trim()) {
      const searchTerm = search.trim();
      where.AND = [
        {
          OR: [
            { name: { contains: searchTerm } },
            { muscleGroup: { contains: searchTerm } },
          ],
        },
      ];
    }

    const exercises = await prisma.exerciseCatalog.findMany({
      where,
      orderBy: [{ category: "asc" }, { name: "asc" }],
    });

    return NextResponse.json(exercises);
  } catch (error) {
    console.error("Erro ao buscar exercícios:", error);
    return NextResponse.json({ error: "Erro ao buscar exercícios" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const trainer = await getTrainerSession();
    if (!trainer) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const body = await req.json();
    const { name, category, muscleGroup } = body;

    if (!name || !name.trim()) {
      return NextResponse.json({ error: "Nome do exercício é obrigatório" }, { status: 400 });
    }

    if (!category || !category.trim()) {
      return NextResponse.json({ error: "Categoria é obrigatória" }, { status: 400 });
    }

    const created = await prisma.exerciseCatalog.create({
      data: {
        trainerId: trainer.id,
        name: name.trim(),
        category: category.trim(),
        muscleGroup: muscleGroup?.trim() || null,
        isCustom: true,
      },
    });

    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    console.error("Erro ao cadastrar exercício:", error);
    return NextResponse.json({ error: "Erro ao cadastrar exercício" }, { status: 500 });
  }
}
