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
