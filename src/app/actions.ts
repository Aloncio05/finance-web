'use server';

import bcrypt from "bcryptjs";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { RecurrenceType, TransactionType } from "@/generated/prisma/client";
import { createSession, destroySession, verifySession } from "@/lib/auth";
import { DEFAULT_CATEGORIES } from "@/lib/constants";
import { parseAmountToCents } from "@/lib/format";
import { prisma } from "@/lib/prisma";
import { authSchema, categorySchema, transactionSchema } from "@/lib/validators";

function fail(path: string, message: string): never {
  redirect(`${path}?error=${encodeURIComponent(message)}`);
}

function succeed(path: string, message: string): never {
  const separator = path.includes("?") ? "&" : "?";
  redirect(`${path}${separator}success=${encodeURIComponent(message)}`);
}

function getNextMonthDate(date: Date) {
  const nextMonthStart = new Date(date.getFullYear(), date.getMonth() + 1, 1, 12);
  const nextMonthLastDay = new Date(date.getFullYear(), date.getMonth() + 2, 0).getDate();

  nextMonthStart.setDate(Math.min(date.getDate(), nextMonthLastDay));
  return nextMonthStart;
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

  const user = await prisma.user.findUnique({
    where: {
      email: parsed.data.email,
    },
  });

  if (!user) {
    fail("/login", "E-mail ou senha inválidos.");
  }

  const isValidPassword = await bcrypt.compare(parsed.data.password, user.passwordHash);

  if (!isValidPassword) {
    fail("/login", "E-mail ou senha inválidos.");
  }

  await createSession(user.id);
  redirect("/dashboard");
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
      },
    });

    if (!transaction) {
      fail("/transactions", "Transação não encontrada.");
    }

    await prisma.transaction.update({
      where: {
        id: transaction.id,
      },
      data: payload,
    });
  } else {
    await prisma.transaction.create({
      data: {
        ...payload,
        userId: session.user.id,
      },
    });
  }

  revalidatePath("/transactions");
  revalidatePath("/dashboard");
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
        in: recurringExpenses.map((transaction) => transaction.id),
      },
    },
    select: {
      carriedFromId: true,
    },
  });

  const copiedIds = new Set(existingCopies.flatMap((transaction) => (transaction.carriedFromId ? [transaction.carriedFromId] : [])));
  const transactionsToCreate = recurringExpenses
    .filter((transaction) => !copiedIds.has(transaction.id))
    .map((transaction) => ({
      userId: session.user.id,
      categoryId: transaction.categoryId,
      type: transaction.type,
      description: transaction.description,
      amountCents: transaction.amountCents,
      transactionDate: getNextMonthDate(transaction.transactionDate),
      notes: transaction.notes,
      recurrenceType: transaction.recurrenceType,
      carriedFromId: transaction.id,
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
  succeed(
    `/transactions?month=${nextMonthValue}`,
    `${transactionsToCreate.length} despesa(s) recorrente(s) foram levadas para ${nextMonthValue}.`,
  );
}
