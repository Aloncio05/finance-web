'use server';

import bcrypt from "bcryptjs";
import crypto from "node:crypto";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { RecurrenceType, TransactionType } from "@/generated/prisma/client";
import { createSession, destroySession, verifySession } from "@/lib/auth";
import { DEFAULT_CATEGORIES } from "@/lib/constants";
import { sendPasswordResetEmail } from "@/lib/email";
import { parseAmountToCents } from "@/lib/format";
import { prisma } from "@/lib/prisma";
import {
  authSchema,
  categorySchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  transactionSchema,
} from "@/lib/validators";

const PASSWORD_RESET_MAX_AGE_MINUTES = 30;
const LOCAL_APP_URL = "http://127.0.0.1:3050";

type PasswordResetTokenRecord = {
  id: string;
  userId: string;
  tokenHash: string;
  expiresAt: Date;
  usedAt: Date | null;
  user: {
    id: string;
    email: string;
  };
};

type PasswordResetTokenClient = {
  deleteMany(args: { where: object }): Promise<unknown>;
  create(args: { data: { tokenHash: string; userId: string; expiresAt: Date } }): Promise<unknown>;
  findFirst(args: {
    where: {
      tokenHash: string;
      usedAt: null;
      expiresAt: {
        gt: Date;
      };
    };
    include: {
      user: {
        select: {
          id: true;
          email: true;
        };
      };
    };
  }): Promise<PasswordResetTokenRecord | null>;
  update(args: { where: { id: string }; data: { usedAt: Date } }): Promise<unknown>;
};

const passwordResetTokens = (prisma as typeof prisma & { passwordResetToken: PasswordResetTokenClient })
  .passwordResetToken;

function fail(path: string, message: string): never {
  redirect(`${path}?error=${encodeURIComponent(message)}`);
}

function succeed(path: string, message: string): never {
  const separator = path.includes("?") ? "&" : "?";
  redirect(`${path}${separator}success=${encodeURIComponent(message)}`);
}

function addMonthsPreservingDay(date: Date, monthsToAdd: number) {
  const nextMonthStart = new Date(date.getFullYear(), date.getMonth() + monthsToAdd, 1, 12);
  const nextMonthLastDay = new Date(date.getFullYear(), date.getMonth() + monthsToAdd + 1, 0).getDate();

  nextMonthStart.setDate(Math.min(date.getDate(), nextMonthLastDay));
  return nextMonthStart;
}

function splitAmountIntoInstallments(totalAmountCents: number, installmentCount: number) {
  const baseAmount = Math.floor(totalAmountCents / installmentCount);
  const remainder = totalAmountCents % installmentCount;

  return Array.from({ length: installmentCount }, (_, index) => baseAmount + (index < remainder ? 1 : 0));
}

function hashOneTimeToken(token: string) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

function getAppUrl() {
  return process.env.APP_URL?.trim() || process.env.NEXT_PUBLIC_APP_URL?.trim() || LOCAL_APP_URL;
}

function isLocalAppUrl(appUrl: string) {
  try {
    const hostname = new URL(appUrl).hostname;
    return hostname === "127.0.0.1" || hostname === "localhost";
  } catch {
    return false;
  }
}

export async function registerAction(formData: FormData) {
  const parsed = authSchema.extend({ name: authSchema.shape.name.unwrap() }).safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    fail("/register", parsed.error.issues[0]?.message ?? "Dados inválidos.");
  }

  const existingUser = await prisma.user.findUnique({
    where: {
      email: parsed.data.email,
    },
    select: {
      id: true,
    },
  });

  if (existingUser) {
    fail("/register", "Já existe uma conta com esse e-mail.");
  }

  const passwordHash = await bcrypt.hash(parsed.data.password, 12);
  let createdUserId: string | null = null;

  try {
    const user = await prisma.user.create({
      data: {
        name: parsed.data.name,
        email: parsed.data.email,
        passwordHash,
        categories: {
          create: DEFAULT_CATEGORIES.map((category) => ({
            name: category.name,
            type: category.type,
            color: category.color,
          })),
        },
      },
      select: {
        id: true,
      },
    });

    createdUserId = user.id;
    await createSession(user.id);
  } catch {
    if (createdUserId) {
      redirect(
        `/login?success=${encodeURIComponent("Conta criada com sucesso. Faça login para continuar.")}`,
      );
    }

    fail("/register", "Não foi possível criar sua conta agora. Tente novamente.");
  }

  redirect("/dashboard");
}

export async function loginAction(formData: FormData) {
  const parsed = authSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    fail("/login", parsed.error.issues[0]?.message ?? "Credenciais inválidas.");
  }

  const user = await prisma.user.findFirst({
    where: {
      email: {
        equals: parsed.data.email,
        mode: "insensitive",
      },
    },
  });

  if (!user) {
    fail("/login", "E-mail ou senha inválidos.");
  }

  const isValidPassword = await bcrypt.compare(parsed.data.password, user.passwordHash);

  if (!isValidPassword) {
    fail("/login", "E-mail ou senha inválidos.");
  }

  if (user.email !== parsed.data.email) {
    try {
      await prisma.user.update({
        where: {
          id: user.id,
        },
        data: {
          email: parsed.data.email,
        },
      });
    } catch {
      // Keep login working even if a legacy duplicate prevents normalization.
    }
  }

  await createSession(user.id);
  redirect("/dashboard");
}

export async function forgotPasswordAction(formData: FormData) {
  const parsed = forgotPasswordSchema.safeParse({
    email: formData.get("email"),
  });

  if (!parsed.success) {
    fail("/forgot-password", parsed.error.issues[0]?.message ?? "Informe um e-mail válido.");
  }

  const user = await prisma.user.findFirst({
    where: {
      email: {
        equals: parsed.data.email,
        mode: "insensitive",
      },
    },
    select: {
      id: true,
      email: true,
    },
  });

  const genericMessage = "Se existir uma conta com esse e-mail, você verá as próximas instruções aqui.";

  if (!user) {
    succeed("/forgot-password", genericMessage);
  }

  const appUrl = getAppUrl();
  const token = crypto.randomBytes(32).toString("hex");
  const tokenHash = hashOneTimeToken(token);
  const expiresAt = new Date(Date.now() + PASSWORD_RESET_MAX_AGE_MINUTES * 60 * 1000);

  await passwordResetTokens.deleteMany({
    where: {
      userId: user.id,
      usedAt: null,
    },
  });

  await passwordResetTokens.create({
    data: {
      tokenHash,
      userId: user.id,
      expiresAt,
    },
  });

  const resetLink = `${appUrl.replace(/\/$/, "")}/reset-password/${token}`;

  if (isLocalAppUrl(appUrl)) {
    redirect(
      `/forgot-password?success=${encodeURIComponent(genericMessage)}&resetLink=${encodeURIComponent(resetLink)}`,
    );
  }

  try {
    await sendPasswordResetEmail({
      to: user.email,
      resetLink,
    });
  } catch {
    fail(
      "/forgot-password",
      "O envio do e-mail de redefinicao nao esta configurado corretamente neste ambiente.",
    );
  }

  succeed("/forgot-password", genericMessage);
}

export async function resetPasswordAction(formData: FormData) {
  const parsed = resetPasswordSchema.safeParse({
    token: formData.get("token"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });

  if (!parsed.success) {
    const token = String(formData.get("token") || "");
    fail(`/reset-password/${token}`, parsed.error.issues[0]?.message ?? "Dados inválidos.");
  }

  const tokenHash = hashOneTimeToken(parsed.data.token);
  const passwordResetToken = await passwordResetTokens.findFirst({
    where: {
      tokenHash,
      usedAt: null,
      expiresAt: {
        gt: new Date(),
      },
    },
    include: {
      user: {
        select: {
          id: true,
          email: true,
        },
      },
    },
  });

  if (!passwordResetToken) {
    fail(`/reset-password/${parsed.data.token}`, "O link de redefinição expirou ou já foi usado.");
  }

  const passwordHash = await bcrypt.hash(parsed.data.password, 12);

  await prisma.user.update({
    where: {
      id: passwordResetToken.user.id,
    },
    data: {
      passwordHash,
      email: passwordResetToken.user.email.trim().toLowerCase(),
    },
  });

  await passwordResetTokens.update({
    where: {
      id: passwordResetToken.id,
    },
    data: {
      usedAt: new Date(),
    },
  });

  await passwordResetTokens.deleteMany({
    where: {
      userId: passwordResetToken.user.id,
      id: {
        not: passwordResetToken.id,
      },
    },
  });

  await prisma.session.deleteMany({
    where: {
      userId: passwordResetToken.user.id,
    },
  });

  redirect(
    `/login?success=${encodeURIComponent("Senha redefinida com sucesso. Entre com a nova senha.")}`,
  );
}

export async function logoutAction() {
  await destroySession();
  redirect("/login");
}

export async function saveCategoryAction(formData: FormData) {
  const session = await verifySession();
  const parsed = categorySchema.safeParse({
    id: formData.get("id") || undefined,
    name: formData.get("name"),
    color: formData.get("color"),
    type: formData.get("type"),
  });

  if (!parsed.success) {
    fail("/categories", parsed.error.issues[0]?.message ?? "Categoria inválida.");
  }

  const payload = {
    name: parsed.data.name,
    color: parsed.data.color,
    type: parsed.data.type,
  };

  try {
    if (parsed.data.id) {
      const category = await prisma.category.findFirst({
        where: {
          id: parsed.data.id,
          userId: session.user.id,
        },
        select: {
          id: true,
        },
      });

      if (!category) {
        fail("/categories", "Categoria não encontrada.");
      }

      await prisma.category.update({
        where: {
          id: category.id,
        },
        data: payload,
      });
    } else {
      await prisma.category.create({
        data: {
          ...payload,
          userId: session.user.id,
        },
      });
    }
  } catch {
    fail("/categories", "Não foi possível salvar a categoria.");
  }

  revalidatePath("/categories");
  revalidatePath("/dashboard");
  revalidatePath("/transactions");
  redirect("/categories");
}

export async function deleteCategoryAction(formData: FormData) {
  const session = await verifySession();
  const id = String(formData.get("id") || "");

  if (!id) {
    fail("/categories", "Categoria inválida.");
  }

  const category = await prisma.category.findFirst({
    where: {
      id,
      userId: session.user.id,
    },
    include: {
      _count: {
        select: {
          transactions: true,
        },
      },
    },
  });

  if (!category) {
    fail("/categories", "Categoria não encontrada.");
  }

  if (category._count.transactions > 0) {
    fail("/categories", "Remova as transações dessa categoria antes de excluí-la.");
  }

  await prisma.category.delete({
    where: {
      id: category.id,
    },
  });

  revalidatePath("/categories");
  revalidatePath("/transactions");
  revalidatePath("/dashboard");
  redirect("/categories");
}

export async function saveTransactionAction(formData: FormData) {
  const session = await verifySession();
  const parsed = transactionSchema.safeParse({
    id: formData.get("id") || undefined,
    description: formData.get("description"),
    notes: formData.get("notes") || undefined,
    type: formData.get("type"),
    categoryId: formData.get("categoryId"),
    amount: formData.get("amount"),
    transactionDate: formData.get("transactionDate"),
    recurrenceType: formData.get("recurrenceType") || RecurrenceType.NONE,
    installmentCount: formData.get("installmentCount") || 1,
  });

  if (!parsed.success) {
    fail("/transactions", parsed.error.issues[0]?.message ?? "Transação inválida.");
  }

  const amountCents = parseAmountToCents(parsed.data.amount);

  if (!amountCents) {
    fail("/transactions", "Informe um valor válido maior que zero.");
  }

  const category = await prisma.category.findFirst({
    where: {
      id: parsed.data.categoryId,
      userId: session.user.id,
    },
    select: {
      id: true,
      type: true,
    },
  });

  if (!category) {
    fail("/transactions", "Categoria não encontrada.");
  }

  if (category.type !== parsed.data.type) {
    const expectedLabel = parsed.data.type === TransactionType.INCOME ? "receita" : "despesa";
    fail("/transactions", `Escolha uma categoria do tipo ${expectedLabel}.`);
  }

  const transactionDate = new Date(`${parsed.data.transactionDate}T12:00:00`);

  if (Number.isNaN(transactionDate.getTime())) {
    fail("/transactions", "Selecione uma data válida.");
  }

  const recurrenceType =
    parsed.data.type === TransactionType.EXPENSE ? parsed.data.recurrenceType : RecurrenceType.NONE;
  const installmentCount = parsed.data.installmentCount;

  if (parsed.data.type === TransactionType.INCOME && installmentCount > 1) {
    fail("/transactions", "Parcelamento só pode ser usado para despesas.");
  }

  if (installmentCount > 1 && recurrenceType !== RecurrenceType.NONE) {
    fail("/transactions", "Use recorrência ou parcelamento, não os dois ao mesmo tempo.");
  }

  const payload = {
    description: parsed.data.description,
    notes: parsed.data.notes || null,
    type: parsed.data.type,
    categoryId: category.id,
    amountCents,
    transactionDate,
    recurrenceType,
  };

  if (parsed.data.id) {
    const transaction = await prisma.transaction.findFirst({
      where: {
        id: parsed.data.id,
        userId: session.user.id,
      },
      select: {
        id: true,
        installmentGroupId: true,
        installmentNumber: true,
        installmentCount: true,
      },
    });

    if (!transaction) {
      fail("/transactions", "Transação não encontrada.");
    }

    if (transaction.installmentCount > 1) {
      await prisma.transaction.update({
        where: {
          id: transaction.id,
        },
        data: {
          ...payload,
          recurrenceType: RecurrenceType.NONE,
          installmentGroupId: transaction.installmentGroupId,
          installmentNumber: transaction.installmentNumber,
          installmentCount: transaction.installmentCount,
        },
      });

      revalidatePath("/transactions");
      revalidatePath("/dashboard");
      revalidatePath("/dashboard/anual");
      redirect("/transactions");
    }

    if (installmentCount > 1) {
      fail("/transactions", "Para transformar um lançamento existente em parcelado, exclua e crie novamente.");
    }

    await prisma.transaction.update({
      where: {
        id: transaction.id,
      },
      data: {
        ...payload,
        installmentGroupId: null,
        installmentNumber: 1,
        installmentCount: 1,
      },
    });
  } else {
    if (installmentCount > 1) {
      const installmentGroupId = crypto.randomUUID();
      const installmentAmounts = splitAmountIntoInstallments(amountCents, installmentCount);

      await prisma.transaction.createMany({
        data: Array.from({ length: installmentCount }, (_, index) => ({
          ...payload,
          userId: session.user.id,
          amountCents: installmentAmounts[index] ?? 0,
          transactionDate: addMonthsPreservingDay(transactionDate, index),
          recurrenceType: RecurrenceType.NONE,
          installmentGroupId,
          installmentNumber: index + 1,
          installmentCount,
        })),
      });
    } else {
      await prisma.transaction.create({
        data: {
          ...payload,
          userId: session.user.id,
          installmentGroupId: null,
          installmentNumber: 1,
          installmentCount: 1,
        },
      });
    }
  }

  revalidatePath("/transactions");
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/anual");
  redirect("/transactions");
}

export async function deleteTransactionAction(formData: FormData) {
  const session = await verifySession();
  const id = String(formData.get("id") || "");

  if (!id) {
    fail("/transactions", "Transação inválida.");
  }

  const transaction = await prisma.transaction.findFirst({
    where: {
      id,
      userId: session.user.id,
    },
    select: {
      id: true,
    },
  });

  if (!transaction) {
    fail("/transactions", "Transação não encontrada.");
  }

  await prisma.transaction.delete({
    where: {
      id: transaction.id,
    },
  });

  revalidatePath("/transactions");
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/anual");
  redirect("/transactions");
}

export async function carryRecurringExpensesAction(formData: FormData) {
  const session = await verifySession();
  const monthValue = String(formData.get("month") || "");

  if (!/^\d{4}-\d{2}$/.test(monthValue)) {
    fail("/transactions", "Selecione um mês válido para continuar.");
  }

  const [year, month] = monthValue.split("-").map(Number);
  const currentMonthStart = new Date(year, month - 1, 1);
  const currentMonthEnd = new Date(year, month, 1);
  const nextMonthStart = new Date(year, month, 1);
  const nextMonthValue = `${nextMonthStart.getFullYear()}-${`${nextMonthStart.getMonth() + 1}`.padStart(2, "0")}`;

  const recurringExpenses = await prisma.transaction.findMany({
    where: {
      userId: session.user.id,
      type: TransactionType.EXPENSE,
      recurrenceType: {
        not: RecurrenceType.NONE,
      },
      transactionDate: {
        gte: currentMonthStart,
        lt: currentMonthEnd,
      },
    },
    orderBy: [{ transactionDate: "asc" }, { createdAt: "asc" }],
  });

  if (recurringExpenses.length === 0) {
    fail("/transactions", "Nenhuma despesa recorrente foi encontrada neste mês.");
  }

  const existingCopies = await prisma.transaction.findMany({
    where: {
      userId: session.user.id,
      carriedFromId: {
        in: recurringExpenses.map((transaction: (typeof recurringExpenses)[number]) => transaction.id),
      },
    },
    select: {
      carriedFromId: true,
    },
  });

  const copiedIds = new Set(
    existingCopies.flatMap((transaction: (typeof existingCopies)[number]) =>
      transaction.carriedFromId ? [transaction.carriedFromId] : [],
    ),
  );
  const transactionsToCreate = recurringExpenses
    .filter((transaction: (typeof recurringExpenses)[number]) => !copiedIds.has(transaction.id))
    .map((transaction: (typeof recurringExpenses)[number]) => ({
      userId: session.user.id,
      categoryId: transaction.categoryId,
      type: transaction.type,
      description: transaction.description,
      amountCents: transaction.amountCents,
      transactionDate: addMonthsPreservingDay(transaction.transactionDate, 1),
      notes: transaction.notes,
      recurrenceType: transaction.recurrenceType,
      carriedFromId: transaction.id,
      installmentGroupId: null,
      installmentNumber: 1,
      installmentCount: 1,
    }));

  if (transactionsToCreate.length === 0) {
    succeed(
      `/transactions?month=${nextMonthValue}`,
      "As despesas recorrentes deste mês já tinham sido levadas para o próximo.",
    );
  }

  await prisma.transaction.createMany({
    data: transactionsToCreate,
  });

  revalidatePath("/transactions");
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/anual");
  succeed(
    `/transactions?month=${nextMonthValue}`,
    `${transactionsToCreate.length} despesa(s) recorrente(s) foram levadas para ${nextMonthValue}.`,
  );
}
