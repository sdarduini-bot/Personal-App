import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { saveUploadedFile } from "@/lib/storage";

// GET: Carrega dados básicos da avaliação para a página pública do aluno
export async function GET(
  request: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    const { token } = params;

    const assessment = await prisma.physicalAssessment.findUnique({
      where: { photoToken: token },
      include: {
        student: {
          select: {
            id: true,
            name: true,
            gender: true,
          },
        },
        photos: {
          orderBy: { createdAt: "asc" },
        },
      },
    });

    if (!assessment) {
      return NextResponse.json(
        { error: "Link de avaliação inválido ou expirado." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      assessment: {
        id: assessment.id,
        date: assessment.date,
        studentName: assessment.student.name,
        studentGender: assessment.student.gender,
        photos: assessment.photos,
      },
    });
  } catch (error) {
    console.error("Erro ao buscar avaliação por token:", error);
    return NextResponse.json(
      { error: "Erro interno ao carregar avaliação." },
      { status: 500 }
    );
  }
}

// POST: Permite ao aluno enviar fotos diretamente pelo link seguro
export async function POST(
  request: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    const { token } = params;

    const assessment = await prisma.physicalAssessment.findUnique({
      where: { photoToken: token },
    });

    if (!assessment) {
      return NextResponse.json(
        { error: "Link de avaliação inválido ou expirado." },
        { status: 404 }
      );
    }

    // O aluno pode enviar tanto via multipart (arquivo direto) quanto json com url já enviada
    const contentType = request.headers.get("content-type") || "";

    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      const file = formData.get("file") as File | null;
      const type = (formData.get("type") as string) || "OTHER";

      if (!file) {
        return NextResponse.json(
          { error: "Nenhum arquivo enviado." },
          { status: 400 }
        );
      }

      const validMimes = ["image/webp", "image/jpeg", "image/png", "image/jpg"];
      if (!validMimes.includes(file.type)) {
        return NextResponse.json(
          { error: "Formato de arquivo inválido. Use WebP, JPEG ou PNG." },
          { status: 400 }
        );
      }

      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      const saved = await saveUploadedFile(buffer, "assessments", file.type);

      // Remover foto anterior do mesmo tipo se já existir nessa avaliação
      await prisma.assessmentPhoto.deleteMany({
        where: {
          assessmentId: assessment.id,
          type,
        },
      });

      // Salvar nova foto
      const photo = await prisma.assessmentPhoto.create({
        data: {
          assessmentId: assessment.id,
          type,
          url: saved.url,
          notes: "Enviado pelo aluno via link seguro",
        },
      });

      return NextResponse.json({
        success: true,
        photo,
      });
    }

    // Caso seja payload JSON com dados já processados
    const body = await request.json();
    const { type, url } = body;

    if (!type || !url) {
      return NextResponse.json(
        { error: "Tipo de foto e URL são obrigatórios." },
        { status: 400 }
      );
    }

    await prisma.assessmentPhoto.deleteMany({
      where: {
        assessmentId: assessment.id,
        type,
      },
    });

    const photo = await prisma.assessmentPhoto.create({
      data: {
        assessmentId: assessment.id,
        type,
        url,
        notes: "Enviado pelo aluno via link seguro",
      },
    });

    return NextResponse.json({
      success: true,
      photo,
    });
  } catch (error) {
    console.error("Erro ao registrar foto do aluno via token:", error);
    return NextResponse.json(
      { error: "Erro interno ao salvar foto." },
      { status: 500 }
    );
  }
}
