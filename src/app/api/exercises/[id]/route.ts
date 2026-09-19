import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json();
    const { name, category, muscleGroup } = body;

    if (!name || !name.trim()) {
      return NextResponse.json({ error: "Nome do exercício é obrigatório" }, { status: 400 });
    }

    const updated = await prisma.exerciseCatalog.update({
      where: { id: params.id },
      data: {
        name: name.trim(),
        ...(category ? { category: category.trim() } : {}),
        ...(muscleGroup !== undefined ? { muscleGroup: muscleGroup?.trim() || null } : {}),
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Erro ao atualizar exercício:", error);
    return NextResponse.json({ error: "Erro ao atualizar exercício" }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.exerciseCatalog.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true, message: "Exercício removido com sucesso" });
  } catch (error) {
    console.error("Erro ao remover exercício:", error);
    return NextResponse.json({ error: "Erro ao remover exercício" }, { status: 500 });
  }
}
