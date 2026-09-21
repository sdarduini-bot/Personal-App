import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { calculateBodyComposition, AssessmentInput } from "@/lib/bodyComposition";

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const assessments = await prisma.physicalAssessment.findMany({
      where: { studentId: params.id },
      orderBy: { date: "desc" },
    });

    return NextResponse.json(assessments);
  } catch (error) {
    console.error("Erro ao buscar avaliações físicas:", error);
    return NextResponse.json(
      { error: "Erro ao buscar histórico de avaliações" },
      { status: 500 }
    );
  }
}

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json();
    const studentId = params.id;

    const student = await prisma.student.findUnique({
      where: { id: studentId },
    });

    if (!student) {
      return NextResponse.json({ error: "Aluno não encontrado" }, { status: 404 });
    }

    const {
      date = new Date().toISOString().split("T")[0],
      protocol = "POLLOCK_7",
      gender = student.gender || "MALE",
      age = 25,
      weight,
      height,
      targetBodyFat = 15,
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

    if (!weight || !height) {
      return NextResponse.json(
        { error: "Peso e altura são obrigatórios para a avaliação." },
        { status: 400 }
      );
    }

    // Calcular composição corporal no servidor
    const calcInput: AssessmentInput = {
      protocol,
      gender,
      age: Number(age) || 25,
      weight: Number(weight),
      height: Number(height),
      targetBodyFat: Number(targetBodyFat) || 15,
      subscapular: subscapular ? Number(subscapular) : null,
      chest: chest ? Number(chest) : null,
      suprailiac: suprailiac ? Number(suprailiac) : null,
      thigh: thigh ? Number(thigh) : null,
      triceps: triceps ? Number(triceps) : null,
      midaxillary: midaxillary ? Number(midaxillary) : null,
      abdominal: abdominal ? Number(abdominal) : null,
      directBodyFat: directBodyFat ? Number(directBodyFat) : null,
      neck: neck ? Number(neck) : null,
      shoulders: shoulders ? Number(shoulders) : null,
      chestCirc: chestCirc ? Number(chestCirc) : null,
      waist: waist ? Number(waist) : null,
      abdomenCirc: abdomenCirc ? Number(abdomenCirc) : null,
      hip: hip ? Number(hip) : null,
      rightArmRelaxed: rightArmRelaxed ? Number(rightArmRelaxed) : null,
      leftArmRelaxed: leftArmRelaxed ? Number(leftArmRelaxed) : null,
      rightArmContracted: rightArmContracted ? Number(rightArmContracted) : null,
      leftArmContracted: leftArmContracted ? Number(leftArmContracted) : null,
      rightForearm: rightForearm ? Number(rightForearm) : null,
      leftForearm: leftForearm ? Number(leftForearm) : null,
      rightThigh: rightThigh ? Number(rightThigh) : null,
      leftThigh: leftThigh ? Number(leftThigh) : null,
      rightCalf: rightCalf ? Number(rightCalf) : null,
      leftCalf: leftCalf ? Number(leftCalf) : null,
    };

    const results = calculateBodyComposition(calcInput);

    // Se o gênero foi especificado e for diferente no aluno, atualiza o aluno
    if (gender && student.gender !== gender) {
      await prisma.student.update({
        where: { id: studentId },
        data: { gender },
      });
    }

    const assessment = await prisma.physicalAssessment.create({
      data: {
        studentId,
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
        notes: notes || null,
      },
    });

    return NextResponse.json(assessment, { status: 201 });
  } catch (error) {
    console.error("Erro ao registrar avaliação física:", error);
    return NextResponse.json(
      { error: "Erro ao processar e salvar avaliação física" },
      { status: 500 }
    );
  }
}
