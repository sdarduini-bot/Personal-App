import crypto from "crypto";
import { prisma } from "@/lib/prisma";

export function generateSecureToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

/**
 * Envia e-mail transacional via Resend API (se RESEND_API_KEY estiver configurada)
 * ou realiza fallback gracioso simulando envio sem travar a aplicação.
 */
export async function sendEmail({ to, subject, html, text }: EmailOptions): Promise<{ success: boolean; simulated?: boolean }> {
  const apiKey = process.env.RESEND_API_KEY;

  if (apiKey) {
    try {
      const fromEmail = process.env.EMAIL_FROM || "Personal Trainer Pro <onboarding@resend.dev>";
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          from: fromEmail,
          to: [to],
          subject,
          html,
          text: text || subject,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        console.warn("[Resend Email Warning]:", errorData);
      } else {
        return { success: true };
      }
    } catch (err) {
      console.error("[Email Send Error]:", err);
    }
  }

  // Fallback / Modo Desenvolvimento ou sem API Key configurada
  console.log(`\n======================================================`);
  console.log(`📧 [EMAIL TRANSACIONAL DISPARADO / SIMULADO]`);
  console.log(`Para: ${to}`);
  console.log(`Assunto: ${subject}`);
  console.log(`======================================================\n`);

  return { success: true, simulated: true };
}

/**
 * Cria ou renova token de convite de novo treinador (48 horas de validade)
 */
export async function createInviteToken(email: string): Promise<string> {
  const token = generateSecureToken();
  const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000); // 48 horas

  // Invalida tokens anteriores não usados desse e-mail
  await prisma.passwordResetToken.updateMany({
    where: { email: email.toLowerCase().trim(), used: false },
    data: { used: true },
  });

  await prisma.passwordResetToken.create({
    data: {
      email: email.toLowerCase().trim(),
      token,
      type: "INVITE",
      expiresAt,
      used: false,
    },
  });

  return token;
}

/**
 * Cria ou renova token de recuperação de senha (1 hora de validade)
 */
export async function createPasswordResetToken(email: string): Promise<string> {
  const token = generateSecureToken();
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hora

  await prisma.passwordResetToken.updateMany({
    where: { email: email.toLowerCase().trim(), used: false },
    data: { used: true },
  });

  await prisma.passwordResetToken.create({
    data: {
      email: email.toLowerCase().trim(),
      token,
      type: "RESET",
      expiresAt,
      used: false,
    },
  });

  return token;
}

/**
 * Dispara e-mail de convite para o novo treinador criar a sua senha
 */
export async function sendInviteEmail(email: string, name: string, token: string, baseUrl: string) {
  const cleanBaseUrl = baseUrl.replace(/\/+$/, "");
  const inviteUrl = `${cleanBaseUrl}/redefinir-senha?token=${token}&type=invite`;

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #09090b; color: #f4f4f5; padding: 24px; margin: 0; }
          .container { max-width: 520px; margin: 0 auto; background: #18181b; border: 1px solid #27272a; border-radius: 20px; padding: 32px; }
          .header { text-align: center; margin-bottom: 24px; }
          .title { font-size: 22px; font-weight: bold; color: #10b981; margin: 0 0 8px 0; }
          .subtitle { font-size: 14px; color: #a1a1aa; margin: 0; }
          .button { display: inline-block; background-color: #10b981; color: #09090b; text-decoration: none; padding: 14px 28px; border-radius: 12px; font-weight: bold; font-size: 14px; margin: 24px 0; }
          .footer { font-size: 11px; color: #71717a; border-top: 1px solid #27272a; padding-top: 16px; margin-top: 24px; text-align: center; }
          .link-fallback { word-break: break-all; font-size: 11px; color: #10b981; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 class="title">Personal Trainer Pro</h1>
            <p class="subtitle">Seu acesso foi autorizado!</p>
          </div>
          <p>Olá, <strong>${name}</strong>!</p>
          <p>Você foi convidado para utilizar a plataforma de gestão de treinos, alunos e avaliação física com Pollock.</p>
          <p>Para começar a usar, clique no botão abaixo e cadastre sua senha de acesso pessoal:</p>
          <div style="text-align: center;">
            <a href="${inviteUrl}" class="button">Cadastrar Minha Senha</a>
          </div>
          <p style="font-size: 12px; color: #a1a1aa;">
            Este link é exclusivo para você e possui validade de <strong>48 horas</strong>.
          </p>
          <div class="footer">
            <p>Se o botão não funcionar, copie e cole o link abaixo no seu navegador:</p>
            <p class="link-fallback">${inviteUrl}</p>
          </div>
        </div>
      </body>
    </html>
  `;

  return sendEmail({
    to: email,
    subject: "Convite de Acesso: Cadastre sua senha no Personal Trainer Pro",
    html,
  });
}

/**
 * Dispara e-mail de recuperação de senha ("Esqueci minha senha")
 */
export async function sendPasswordResetEmail(email: string, token: string, baseUrl: string) {
  const cleanBaseUrl = baseUrl.replace(/\/+$/, "");
  const resetUrl = `${cleanBaseUrl}/redefinir-senha?token=${token}`;

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #09090b; color: #f4f4f5; padding: 24px; margin: 0; }
          .container { max-width: 520px; margin: 0 auto; background: #18181b; border: 1px solid #27272a; border-radius: 20px; padding: 32px; }
          .header { text-align: center; margin-bottom: 24px; }
          .title { font-size: 22px; font-weight: bold; color: #10b981; margin: 0 0 8px 0; }
          .subtitle { font-size: 14px; color: #a1a1aa; margin: 0; }
          .button { display: inline-block; background-color: #10b981; color: #09090b; text-decoration: none; padding: 14px 28px; border-radius: 12px; font-weight: bold; font-size: 14px; margin: 24px 0; }
          .footer { font-size: 11px; color: #71717a; border-top: 1px solid #27272a; padding-top: 16px; margin-top: 24px; text-align: center; }
          .link-fallback { word-break: break-all; font-size: 11px; color: #10b981; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 class="title">Personal Trainer Pro</h1>
            <p class="subtitle">Recuperação de Acesso</p>
          </div>
          <p>Olá,</p>
          <p>Recebemos uma solicitação para redefinir a senha da sua conta de treinador.</p>
          <p>Para escolher uma nova senha, clique no botão seguro abaixo:</p>
          <div style="text-align: center;">
            <a href="${resetUrl}" class="button">Redefinir Minha Senha</a>
          </div>
          <p style="font-size: 12px; color: #a1a1aa;">
            Por segurança, este link expira em <strong>1 hora</strong> e só pode ser utilizado uma única vez.
          </p>
          <p style="font-size: 11px; color: #71717a;">
            Se você não solicitou a redefinição de senha, desconsidere esta mensagem. Sua conta permanece segura.
          </p>
          <div class="footer">
            <p>Se o botão não funcionar, copie e cole o link abaixo no seu navegador:</p>
            <p class="link-fallback">${resetUrl}</p>
          </div>
        </div>
      </body>
    </html>
  `;

  return sendEmail({
    to: email,
    subject: "Recuperação de Senha: Personal Trainer Pro",
    html,
  });
}
