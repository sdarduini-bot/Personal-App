import { promises as fs } from "fs";
import path from "path";
import { randomUUID } from "crypto";

export type UploadCategory = "avatars" | "assessments";

export interface SaveFileResult {
  url: string;
  fileName: string;
  sizeBytes: number;
}

/**
 * Salva um buffer de arquivo no storage apropriado.
 * Por padrão, armazena no diretório público local com hashes não enumeráveis.
 * Se configurado S3/R2 futuramente, a alteração é transparente para os controladores.
 */
export async function saveUploadedFile(
  fileBuffer: Buffer,
  category: UploadCategory,
  originalMimeType: string
): Promise<SaveFileResult> {
  // Determinar extensão segura
  let extension = "webp";
  if (originalMimeType === "image/jpeg" || originalMimeType === "image/jpg") {
    extension = "jpg";
  } else if (originalMimeType === "image/png") {
    extension = "png";
  }

  const uniqueId = randomUUID().replace(/-/g, "");
  const fileName = `${category}-${uniqueId}.${extension}`;

  // Diretório de destino dentro de public/uploads
  const targetDir = path.join(process.cwd(), "public", "uploads", category);
  await fs.mkdir(targetDir, { recursive: true });

  const fullPath = path.join(targetDir, fileName);
  await fs.writeFile(fullPath, fileBuffer);

  const publicUrl = `/uploads/${category}/${fileName}`;

  return {
    url: publicUrl,
    fileName,
    sizeBytes: fileBuffer.length,
  };
}

/**
 * Exclui um arquivo antigo de mídia pelo path público para não acumular lixo.
 */
export async function deleteUploadedFile(publicUrl: string): Promise<boolean> {
  try {
    if (!publicUrl || !publicUrl.startsWith("/uploads/")) {
      return false;
    }

    // Normalizar caminho relativo
    const relativePath = publicUrl.replace(/^\//, "");
    const fullPath = path.join(process.cwd(), "public", relativePath);

    await fs.unlink(fullPath);
    return true;
  } catch {
    // Se o arquivo não existir ou falhar, ignora silenciosamente
    return false;
  }
}
