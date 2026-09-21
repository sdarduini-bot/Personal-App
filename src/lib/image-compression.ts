/**
 * Utilitário de compressão de imagens no navegador (Client-Side)
 * Garante que fotos pesadas (5MB-15MB) tiradas no celular sejam redimensionadas
 * e convertidas em WebP leve (30KB a 180KB) ANTES de trafegar pela rede ou chegar ao servidor.
 */

export interface CompressionOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  mimeType?: "image/webp" | "image/jpeg";
}

export async function compressImage(
  file: File,
  options: CompressionOptions = {}
): Promise<File> {
  const {
    maxWidth = 1200,
    maxHeight = 1600,
    quality = 0.82,
    mimeType = "image/webp",
  } = options;

  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onerror = () => reject(new Error("Erro ao ler arquivo de imagem"));

    reader.onload = (e) => {
      const img = new Image();
      img.onerror = () => reject(new Error("Erro ao carregar elemento de imagem"));

      img.onload = () => {
        let width = img.width;
        let height = img.height;

        // Calcular proporção respeitando limites máximos
        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        if (!ctx) {
          return reject(new Error("Não foi possível inicializar canvas 2D"));
        }

        // Suavização de alta qualidade
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = "high";

        // Desenhar imagem redimensionada
        ctx.drawImage(img, 0, 0, width, height);

        // Exportar para WebP com fallback para JPEG se não suportado
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              return reject(new Error("Falha ao gerar blob comprimido"));
            }

            const extension = mimeType === "image/webp" ? "webp" : "jpg";
            const originalBase = file.name.replace(/\.[^/.]+$/, "");
            const newFileName = `${originalBase}-compressed.${extension}`;

            const compressedFile = new File([blob], newFileName, {
              type: mimeType,
              lastModified: Date.now(),
            });

            resolve(compressedFile);
          },
          mimeType,
          quality
        );
      };

      img.src = e.target?.result as string;
    };

    reader.readAsDataURL(file);
  });
}

/**
 * Atalho para avatar de identificação:
 * Max 400x400, qualidade 82% WebP (~20KB a 40KB)
 */
export async function compressAvatar(file: File): Promise<File> {
  return compressImage(file, {
    maxWidth: 400,
    maxHeight: 400,
    quality: 0.82,
    mimeType: "image/webp",
  });
}

/**
 * Atalho para fotos de avaliação corporal (Frente, Costas, Lados):
 * Max 1200x1600, qualidade 80% WebP (~120KB a 200KB)
 */
export async function compressBodyPhoto(file: File): Promise<File> {
  return compressImage(file, {
    maxWidth: 1200,
    maxHeight: 1600,
    quality: 0.8,
    mimeType: "image/webp",
  });
}
