import "server-only";

import { Resend } from "resend";

type PasswordResetEmailInput = {
  to: string;
  resetLink: string;
};

function getRequiredEnv(name: "RESEND_API_KEY" | "EMAIL_FROM") {
  const value = process.env[name]?.trim();

  if (!value) {
    throw new Error(`Missing required email configuration: ${name}`);
  }

  return value;
}

export async function sendPasswordResetEmail({ to, resetLink }: PasswordResetEmailInput) {
  const resend = new Resend(getRequiredEnv("RESEND_API_KEY"));

  await resend.emails.send({
    from: getRequiredEnv("EMAIL_FROM"),
    to,
    subject: "Redefina sua senha no Finance Web",
    text: [
      "Recebemos um pedido para redefinir a sua senha no Finance Web.",
      "",
      `Abra este link para criar uma nova senha: ${resetLink}`,
      "",
      "Se voce nao pediu essa alteracao, ignore este e-mail.",
      "O link expira em 30 minutos.",
    ].join("\n"),
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #0f172a;">
        <h1 style="font-size: 20px; margin-bottom: 16px;">Redefina sua senha no Finance Web</h1>
        <p>Recebemos um pedido para redefinir a sua senha.</p>
        <p>
          <a
            href="${resetLink}"
            style="display: inline-block; padding: 12px 18px; background: #22d3ee; color: #020617; border-radius: 9999px; text-decoration: none; font-weight: 700;"
          >
            Criar nova senha
          </a>
        </p>
        <p>Se o botao nao abrir, copie e cole este link no navegador:</p>
        <p><a href="${resetLink}">${resetLink}</a></p>
        <p>Se voce nao pediu essa alteracao, ignore este e-mail. O link expira em 30 minutos.</p>
      </div>
    `,
  });
}
