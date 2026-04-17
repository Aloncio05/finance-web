import { RecurrenceType, TransactionType } from "@/generated/prisma/client";
import { z } from "zod";

export const authSchema = z.object({
  name: z.string().min(2, "Informe um nome com ao menos 2 caracteres.").optional(),
  email: z.email("Informe um e-mail válido.").trim().toLowerCase(),
  password: z.string().min(6, "A senha precisa ter ao menos 6 caracteres."),
});

export const forgotPasswordSchema = z.object({
  email: authSchema.shape.email,
});

export const resetPasswordSchema = z
  .object({
    token: z.string().min(1, "Token inválido."),
    password: authSchema.shape.password,
    confirmPassword: z.string().min(6, "Confirme a nova senha."),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "As senhas não coincidem.",
    path: ["confirmPassword"],
  });

export const categorySchema = z.object({
  id: z.string().optional(),
  name: z.string().trim().min(2, "Informe um nome para a categoria."),
  color: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/, "Selecione uma cor válida."),
  type: z.enum(TransactionType),
});

export const transactionSchema = z.object({
  id: z.string().optional(),
  description: z.string().trim().min(2, "Informe uma descrição."),
  notes: z.string().trim().max(240).optional(),
  type: z.enum(TransactionType),
  categoryId: z.string().min(1, "Selecione uma categoria."),
  amount: z.string().min(1, "Informe um valor."),
  transactionDate: z.string().min(1, "Selecione uma data."),
  recurrenceType: z.enum(RecurrenceType).default(RecurrenceType.NONE),
  installmentCount: z.coerce
    .number({ message: "Informe a quantidade de parcelas." })
    .int("A quantidade de parcelas deve ser um número inteiro.")
    .min(1, "A quantidade mínima é 1x.")
    .max(24, "O parcelamento máximo é 24x."),
});
