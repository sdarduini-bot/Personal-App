import crypto from "crypto";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

const AUTH_SECRET =
  process.env.AUTH_SECRET ||
  "pedro_trainer_secret_key_change_in_production_9988223344556677";

export const SESSION_COOKIE_NAME = "pedro_pt_session";

/**
 * Cria hash de senha forte usando scrypt com salt aleatório
 */
export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const derivedKey = crypto.scryptSync(password.trim(), salt, 64);
  return `${salt}:${derivedKey.toString("hex")}`;
}

/**
 * Valida a senha comparando com o hash scrypt de forma segura contra timing attacks
 */
export function verifyPassword(password: string, storedHash: string): boolean {
  try {
    if (!storedHash) return false;

    // Suporte retrocompatível caso seja o PIN padrão em texto puro (ex: "1234")
    if (!storedHash.includes(":")) {
      return crypto.timingSafeEqual(
        Buffer.from(password.trim()),
        Buffer.from(storedHash.trim())
      );
    }

    const [salt, key] = storedHash.split(":");
    const keyBuffer = Buffer.from(key, "hex");
    const derivedKey = crypto.scryptSync(password.trim(), salt, 64);

    return crypto.timingSafeEqual(keyBuffer, derivedKey);
  } catch {
    return false;
  }
}

function stringToArrayBuffer(str: string): ArrayBuffer {
  const enc = new TextEncoder();
  const uint8 = enc.encode(str);
  const ab = new ArrayBuffer(uint8.byteLength);
  new Uint8Array(ab).set(uint8);
  return ab;
}

function bufferToHex(buffer: ArrayBuffer): string {
  const byteArray = new Uint8Array(buffer);
  return Array.from(byteArray)
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

export interface TrainerSessionPayload {
  trainerId: string;
  email: string;
  name: string;
  role: string;
}

/**
 * Gera token JWT assinado com HMAC-SHA256 para o treinador logado
 */
export async function createTrainerToken(payload: TrainerSessionPayload): Promise<string> {
  const fullPayload = JSON.stringify({
    ...payload,
    createdAt: Date.now(),
    nonce: Math.random().toString(36).substring(2),
  });

  const keyBuffer = stringToArrayBuffer(AUTH_SECRET);
  const dataBuffer = stringToArrayBuffer(fullPayload);

  const key = await crypto.subtle.importKey(
    "raw",
    keyBuffer,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const signatureBuffer = await crypto.subtle.sign("HMAC", key, dataBuffer);
  const signature = bufferToHex(signatureBuffer);

  const token = btoa(`${fullPayload}.${signature}`)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");

  return token;
}

/**
 * Valida o token JWT e retorna os dados decodificados do treinador
 */
export async function verifyTrainerToken(
  token: string | undefined | null
): Promise<{ valid: boolean; payload?: TrainerSessionPayload }> {
  if (!token) return { valid: false };

  try {
    let b64 = token.replace(/-/g, "+").replace(/_/g, "/");
    while (b64.length % 4) b64 += "=";
    const decoded = atob(b64);

    const lastDot = decoded.lastIndexOf(".");
    if (lastDot === -1) return { valid: false };

    const payloadStr = decoded.substring(0, lastDot);
    const signature = decoded.substring(lastDot + 1);

    const keyBuffer = stringToArrayBuffer(AUTH_SECRET);
    const dataBuffer = stringToArrayBuffer(payloadStr);

    const key = await crypto.subtle.importKey(
      "raw",
      keyBuffer,
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    );

    const expectedSigBuffer = await crypto.subtle.sign("HMAC", key, dataBuffer);
    const expectedSig = bufferToHex(expectedSigBuffer);

    if (signature !== expectedSig) {
      return { valid: false };
    }

    const data = JSON.parse(payloadStr);
    return {
      valid: true,
      payload: {
        trainerId: data.trainerId || "trainer_pedro",
        email: data.email || "pedro@personal.com",
        name: data.name || "Pedro Personal",
        role: data.role || "TRAINER",
      },
    };
  } catch {
    return { valid: false };
  }
}

/**
 * Helper do Servidor: obtém o treinador autenticado na requisição atual
 */
export async function getTrainerSession() {
  try {
    const cookieStore = cookies();
    const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME)?.value;
    if (!sessionCookie) return null;

    const verification = await verifyTrainerToken(sessionCookie);
    if (!verification.valid || !verification.payload) return null;

    const trainer = await prisma.trainer.findUnique({
      where: { id: verification.payload.trainerId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        phone: true,
        pixKey: true,
        bio: true,
        themePreference: true,
        subscriptionStatus: true,
        trialEndsAt: true,
      },
    });

    if (!trainer || !trainer.isActive) {
      return null;
    }

    return trainer;
  } catch {
    return null;
  }
}

/**
 * Verifica se a sessão atual pertence a um Administrador
 */
export async function isAdminSession(): Promise<boolean> {
  const trainer = await getTrainerSession();
  return !!trainer && trainer.role === "ADMIN";
}

let hasVerifiedAdmin = false;

/**
 * Garante a existência de uma conta de Administrador no banco de dados
 */
export async function ensureAdminAccount() {
  if (hasVerifiedAdmin) return;
  try {
    const adminExists = await prisma.trainer.findFirst({
      where: { role: "ADMIN" },
    });

    if (!adminExists) {
      await prisma.trainer.create({
        data: {
          id: "trainer_admin",
          name: "Administrador",
          email: "admin@personal.com",
          passwordHash: hashPassword("admin123"),
          role: "ADMIN",
          isActive: true,
          phone: "(11) 99999-9999",
          pixKey: "admin@personal.com",
          bio: "Administrador Mestre da Plataforma",
          themePreference: "emerald",
        },
      });
    }
    hasVerifiedAdmin = true;
  } catch (err) {
    console.error("Erro ao verificar conta admin:", err);
  }
}
