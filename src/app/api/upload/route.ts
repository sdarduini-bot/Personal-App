import { NextRequest, NextResponse } from "next/server";
import { verifyWebSessionToken } from "@/lib/auth-token-web";
import { saveUploadedFile, UploadCategory } from "@/lib/storage";

export async function POST(request: NextRequest) {
  try {
    // 1. Validar autenticação do treinador
    const sessionCookie = request.cookies.get("pedro_pt_session")?.value;
    const isAuth = await verifyWebSessionToken(sessionCookie);

    if (!isAuth) {
      return NextResponse.json(
        { error: "Acesso não autorizado para upload." },
        { status: 401 }
      );
    }

    // 2. Extrair dados multipart
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const rawCategory = formData.get("category") as string | null;

    if (!file) {
      return NextResponse.json(
        { error: "Nenhum arquivo enviado." },
        { status: 400 }
      );
    }

    const category: UploadCategory =
      rawCategory === "assessments" ? "assessments" : "avatars";

    // 3. Validação de formato (apenas imagens)
    const validMimes = ["image/webp", "image/jpeg", "image/png", "image/jpg"];
    if (!validMimes.includes(file.type)) {
      return NextResponse.json(
        { error: "Formato de arquivo inválido. Use WebP, JPEG ou PNG." },
        { status: 400 }
      );
    }

    // 4. Limite de tamanho máximo (3MB) - as fotos já devem vir comprimidas em < 300KB
    const MAX_SIZE = 3 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { error: "Arquivo muito grande. O limite máximo é 3MB." },
        { status: 400 }
      );
    }

    // 5. Salvar arquivo
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const saved = await saveUploadedFile(buffer, category, file.type);

    return NextResponse.json({
      success: true,
      url: saved.url,
      fileName: saved.fileName,
      sizeBytes: saved.sizeBytes,
    });
  } catch (error: any) {
    console.error("Erro na rota de upload:", error);
    return NextResponse.json(
      { error: error?.message || "Erro interno ao processar upload." },
      { status: 500 }
    );
  }
}
