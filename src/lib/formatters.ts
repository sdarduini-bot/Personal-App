import { format, parseISO, isValid } from "date-fns";
import { ptBR } from "date-fns/locale";

/** Formata número para moeda brasileira R$ */
export function formatCurrency(value: number | null | undefined): string {
  if (value === null || value === undefined || isNaN(value)) return "R$ 0,00";
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

/** Formata data para pt-BR (ex: "19 de Setembro de 2026") */
export function formatDateLong(dateStr: string | null | undefined): string {
  if (!dateStr) return "-";
  try {
    const d = typeof dateStr === "string" ? parseISO(dateStr) : dateStr;
    if (!isValid(d)) return dateStr;
    return format(d, "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
  } catch {
    return dateStr;
  }
}

/** Formata data curta (ex: "19/09/2026") */
export function formatDateShort(dateStr: string | null | undefined): string {
  if (!dateStr) return "-";
  try {
    const parts = dateStr.split("-");
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    const d = parseISO(dateStr);
    if (!isValid(d)) return dateStr;
    return format(d, "dd/MM/yyyy");
  } catch {
    return dateStr;
  }
}

/** Formata dia da semana (ex: "Sábado") */
export function formatDayOfWeek(dateStr: string): string {
  try {
    const d = parseISO(dateStr);
    if (!isValid(d)) return "";
    const day = format(d, "EEEE", { locale: ptBR });
    return day.charAt(0).toUpperCase() + day.slice(1);
  } catch {
    return "";
  }
}

/** Limpa telefone para formato numérico de envio (ex: 5511999998888) */
export function sanitizePhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 10 || digits.length === 11) {
    return `55${digits}`;
  }
  return digits;
}

/** Gera link do WhatsApp Web / Mobile com texto */
export function buildWhatsAppLink(phone: string, message: string): string {
  const sanitized = sanitizePhone(phone);
  const encodedText = encodeURIComponent(message);
  return `https://wa.me/${sanitized}?text=${encodedText}`;
}
