import crypto from "crypto";

// Chave secreta de autenticação do servidor (persistida ou gerada)
const AUTH_SECRET =
  process.env.AUTH_SECRET ||
  "pedro_trainer_secret_key_change_in_production_9988223344556677";

// Memória de tentativas falhas de login (Rate Limiting)
interface AttemptRecord {
  count: number;
  lockedUntil: number;
}

const loginAttempts = new Map<string, AttemptRecord>();
const MAX_ATTEMPTS = 5;
const LOCKOUT_MS = 10 * 60 * 1000; // 10 minutos de bloqueio após 5 falhas

/**
 * Cria hash seguro do PIN com scrypt e salt aleatório
 */
export function hashPin(pin: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const derivedKey = crypto.scryptSync(pin, salt, 64);
  return `${salt}:${derivedKey.toString("hex")}`;
}

/**
 * Verifica o PIN contra o hash armazenado de forma segura contra Timing Attacks
 */
export function verifyPin(pin: string, storedHashOrPlain: string): boolean {
  try {
    // Suporte retrocompatível para hash ou texto puro inicial
    if (!storedHashOrPlain.includes(":")) {
      // Se ainda for o texto padrão "1234", verifica e permite migração
      return crypto.timingSafeEqual(
        Buffer.from(pin.trim()),
        Buffer.from(storedHashOrPlain.trim())
      );
    }

    const [salt, key] = storedHashOrPlain.split(":");
    const keyBuffer = Buffer.from(key, "hex");
    const derivedKey = crypto.scryptSync(pin.trim(), salt, 64);

    return crypto.timingSafeEqual(keyBuffer, derivedKey);
  } catch {
    return false;
  }
}

export { createWebSessionToken as createSessionToken, verifyWebSessionToken as verifySessionToken } from "./auth-token-web";

/**
 * Verifica o rate limit para proteção contra força bruta no PIN
 */
export function checkRateLimit(identifier: string): {
  allowed: boolean;
  remainingAttempts: number;
  lockoutSeconds: number;
} {
  const now = Date.now();
  const record = loginAttempts.get(identifier);

  if (!record) {
    return { allowed: true, remainingAttempts: MAX_ATTEMPTS, lockoutSeconds: 0 };
  }

  if (record.lockedUntil > now) {
    const lockoutSeconds = Math.ceil((record.lockedUntil - now) / 1000);
    return { allowed: false, remainingAttempts: 0, lockoutSeconds };
  }

  // Se o lockout já passou, resetar
  if (record.lockedUntil > 0 && record.lockedUntil <= now) {
    loginAttempts.delete(identifier);
    return { allowed: true, remainingAttempts: MAX_ATTEMPTS, lockoutSeconds: 0 };
  }

  const remaining = Math.max(0, MAX_ATTEMPTS - record.count);
  return { allowed: remaining > 0, remainingAttempts: remaining, lockoutSeconds: 0 };
}

/**
 * Registra tentativa falha e ativa bloqueio temporário se atingir o limite
 */
export function recordFailedAttempt(identifier: string): {
  isLocked: boolean;
  lockoutSeconds: number;
  remainingAttempts: number;
} {
  const now = Date.now();
  const record = loginAttempts.get(identifier) || { count: 0, lockedUntil: 0 };

  record.count += 1;

  if (record.count >= MAX_ATTEMPTS) {
    record.lockedUntil = now + LOCKOUT_MS;
    loginAttempts.set(identifier, record);
    return {
      isLocked: true,
      lockoutSeconds: Math.ceil(LOCKOUT_MS / 1000),
      remainingAttempts: 0,
    };
  }

  loginAttempts.set(identifier, record);
  return {
    isLocked: false,
    lockoutSeconds: 0,
    remainingAttempts: MAX_ATTEMPTS - record.count,
  };
}

/**
 * Limpa o histórico de tentativas após login bem-sucedido
 */
export function resetFailedAttempts(identifier: string): void {
  loginAttempts.delete(identifier);
}
