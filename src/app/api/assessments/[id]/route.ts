import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { calculateBodyComposition, AssessmentInput } from "@/lib/bodyComposition";

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const assessment = await prisma.physicalAssessment.findUnique({
      where: { id: params.id },
      include: { student: true },
    });

    if (!assessment) {
      return NextResponse.json({ error: "Avaliação não encontrada" }, { status: 404 });
    }

    return NextResponse.json(assessment);
  } catch (error) {
    console.error("Erro ao buscar avaliação:", error);
    return NextResponse.json({ error: "Erro ao buscar avaliação" }, { status: 500 });
  }
}

export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json();
    const existing = await prisma.physicalAssessment.findUnique({
      where: { id: params.id },
    });

    if (!existing) {
      return NextResponse.json({ error: "Avaliação não encontrada" }, { status: 404 });
    }

    const {
      date = existing.date,
      protocol = existing.protocol,
      gender = existing.gender,
      age = existing.age,
      weight = existing.weight,
      height = existing.height,
      targetBodyFat = existing.targetBodyFat,
      subscapular,
      chest,
      suprailiac,
      thigh,
      triceps,
      midaxillary,
      abdominal,
      directBodyFat,
      neck,
      shoulders,
      chestCirc,
      waist,
      abdomenCirc,
      hip,
      rightArmRelaxed,
      leftArmRelaxed,
      rightArmContracted,
      leftArmContracted,
      rightForearm,
      leftForearm,
      rightThigh,
      leftThigh,
      rightCalf,
      leftCalf,
      notes,
    } = body;

    const calcInput: AssessmentInput = {
      protocol,
      gender,
      age: Number(age) || 25,
      weight: Number(weight),
      height: Number(height),
      targetBodyFat: Number(targetBodyFat) || 15,
      subscapular: subscapular !== undefined ? (subscapular ? Number(subscapular) : null) : existing.subscapular,
      chest: chest !== undefined ? (chest ? Number(chest) : null) : existing.chest,
      suprailiac: suprailiac !== undefined ? (suprailiac ? Number(suprailiac) : null) : existing.suprailiac,
      thigh: thigh !== undefined ? (thigh ? Number(thigh) : null) : existing.thigh,
      triceps: triceps !== undefined ? (triceps ? Number(triceps) : null) : existing.triceps,
      midaxillary: midaxillary !== undefined ? (midaxillary ? Number(midaxillary) : null) : existing.midaxillary,
      abdominal: abdominal !== undefined ? (abdominal ? Number(abdominal) : null) : existing.abdominal,
      directBodyFat: directBodyFat !== undefined ? (directBodyFat ? Number(directBodyFat) : null) : existing.directBodyFat,
      neck: neck !== undefined ? (neck ? Number(neck) : null) : existing.neck,
      shoulders: shoulders !== undefined ? (shoulders ? Number(shoulders) : null) : existing.shoulders,
      chestCirc: chestCirc !== undefined ? (chestCirc ? Number(chestCirc) : null) : existing.chestCirc,
      waist: waist !== undefined ? (waist ? Number(waist) : null) : existing.waist,
      abdomenCirc: abdomenCirc !== undefined ? (abdomenCirc ? Number(abdomenCirc) : null) : existing.abdomenCirc,
      hip: hip !== undefined ? (hip ? Number(hip) : null) : existing.hip,
      rightArmRelaxed: rightArmRelaxed !== undefined ? (rightArmRelaxed ? Number(rightArmRelaxed) : null) : existing.rightArmRelaxed,
      leftArmRelaxed: leftArmRelaxed !== undefined ? (leftArmRelaxed ? Number(leftArmRelaxed) : null) : existing.leftArmRelaxed,
      rightArmContracted: rightArmContracted !== undefined ? (rightArmContracted ? Number(rightArmContracted) : null) : existing.rightArmContracted,
      leftArmContracted: leftArmContracted !== undefined ? (leftArmContracted ? Number(leftArmContracted) : null) : existing.leftArmContracted,
      rightForearm: rightForearm !== undefined ? (rightForearm ? Number(rightForearm) : null) : existing.rightForearm,
      leftForearm: leftForearm !== undefined ? (leftForearm ? Number(leftForearm) : null) : existing.leftForearm,
      rightThigh: rightThigh !== undefined ? (rightThigh ? Number(rightThigh) : null) : existing.rightThigh,
      leftThigh: leftThigh !== undefined ? (leftThigh ? Number(leftThigh) : null) : existing.leftThigh,
      rightCalf: rightCalf !== undefined ? (rightCalf ? Number(rightCalf) : null) : existing.rightCalf,
      leftCalf: leftCalf !== undefined ? (leftCalf ? Number(leftCalf) : null) : existing.leftCalf,
    };

    const results = calculateBodyComposition(calcInput);

    const updated = await prisma.physicalAssessment.update({
      where: { id: params.id },
      data: {
        date,
        protocol,
        gender,
        age: calcInput.age,
        weight: calcInput.weight,
        height: calcInput.height,
        targetBodyFat: calcInput.targetBodyFat,
        subscapular: calcInput.subscapular,
        chest: calcInput.chest,
        suprailiac: calcInput.suprailiac,
        thigh: calcInput.thigh,
        triceps: calcInput.triceps,
        midaxillary: calcInput.midaxillary,
        abdominal: calcInput.abdominal,
        directBodyFat: calcInput.directBodyFat,
        neck: calcInput.neck,
        shoulders: calcInput.shoulders,
        chestCirc: calcInput.chestCirc,
        waist: calcInput.waist,
        abdomenCirc: calcInput.abdomenCirc,
        hip: calcInput.hip,
        rightArmRelaxed: calcInput.rightArmRelaxed,
        leftArmRelaxed: calcInput.leftArmRelaxed,
        rightArmContracted: calcInput.rightArmContracted,
        leftArmContracted: calcInput.leftArmContracted,
        rightForearm: calcInput.rightForearm,
        leftForearm: calcInput.leftForearm,
        rightThigh: calcInput.rightThigh,
        leftThigh: calcInput.leftThigh,
        rightCalf: calcInput.rightCalf,
        leftCalf: calcInput.leftCalf,
        bodyFatPercent: results.bodyFatPercent,
        fatMass: results.fatMass,
        leanMass: results.leanMass,
        idealWeight: results.idealWeight,
        excessWeight: results.excessWeight,
        imc: results.imc,
        rcq: results.rcq,
        sumFolds: results.sumFolds,
        bodyDensity: results.bodyDensity,
        notes: notes !== undefined ? notes : existing.notes,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Erro ao atualizar avaliação física:", error);
    return NextResponse.json({ error: "Erro ao atualizar avaliação" }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.physicalAssessment.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ message: "Avaliação excluída com sucesso" });
  } catch (error) {
    console.error("Erro ao excluir avaliação física:", error);
    return NextResponse.json({ error: "Erro ao excluir avaliação" }, { status: 500 });
  }
}
