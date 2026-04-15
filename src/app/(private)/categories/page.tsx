import Link from "next/link";

import { deleteCategoryAction, saveCategoryAction } from "@/app/actions";
import { SubmitButton } from "@/components/submit-button";
import { TransactionType } from "@/generated/prisma/client";
import { verifySession } from "@/lib/auth";
import { getSingleParam } from "@/lib/format";
import { prisma } from "@/lib/prisma";

type CategoriesPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function CategoriesPage({ searchParams }: CategoriesPageProps) {
  const session = await verifySession();
  const params = await searchParams;
  const error = getSingleParam(params.error);
  const editId = getSingleParam(params.edit);

  const [categories, categoryToEdit] = await Promise.all([
    prisma.category.findMany({
      where: {
        userId: session.user.id,
      },
      include: {
        _count: {
          select: {
            transactions: true,
          },
        },
      },
      orderBy: [{ type: "asc" }, { name: "asc" }],
    }),
    editId
      ? prisma.category.findFirst({
          where: {
            id: editId,
            userId: session.user.id,
          },
        })
      : Promise.resolve(null),
  ]);

  return (
    <div className="grid gap-6 xl:grid-cols-[380px,1fr]">
      <section className="rounded-[28px] border border-white/10 bg-slate-900/80 p-6">
        <div>
          <p className="text-sm uppercase tracking-[0.25em] text-cyan-300">Organização</p>
          <h2 className="mt-3 text-2xl font-semibold text-white">
            {categoryToEdit ? "Editar categoria" : "Nova categoria"}
          </h2>
          <p className="mt-2 text-sm leading-7 text-slate-400">
            Categorias claras deixam o dashboard muito mais útil e facilitam enxergar padrões de consumo.
          </p>
        </div>

        {error ? (
          <div className="mt-6 rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
            {error}
          </div>
        ) : null}

        <form action={saveCategoryAction} className="mt-6 space-y-4">
          <input type="hidden" name="id" defaultValue={categoryToEdit?.id} />

          <label className="block space-y-2">
            <span className="text-sm text-slate-300">Nome</span>
            <input
              name="name"
              required
              defaultValue={categoryToEdit?.name}
              className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none transition focus:border-cyan-300"
              placeholder="Ex.: Academia"
            />
          </label>

          <label className="block space-y-2">
            <span className="text-sm text-slate-300">Tipo</span>
            <select
              name="type"
              defaultValue={categoryToEdit?.type ?? TransactionType.EXPENSE}
              className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none transition focus:border-cyan-300"
            >
              <option value={TransactionType.EXPENSE}>Despesa</option>
              <option value={TransactionType.INCOME}>Receita</option>
            </select>
          </label>

          <label className="block space-y-2">
            <span className="text-sm text-slate-300">Cor</span>
            <input
              name="color"
              type="color"
              defaultValue={categoryToEdit?.color ?? "#14b8a6"}
              className="h-12 w-full rounded-2xl border border-white/10 bg-white/5 px-2 py-2"
            />
          </label>

          <SubmitButton className="w-full rounded-2xl bg-cyan-400 px-4 py-3 font-semibold text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-70">
            {categoryToEdit ? "Atualizar categoria" : "Salvar categoria"}
          </SubmitButton>

          {categoryToEdit ? (
            <Link href="/categories" className="block text-center text-sm font-medium text-slate-400 transition hover:text-white">
              Cancelar edição
            </Link>
          ) : null}
        </form>
      </section>

      <section className="rounded-[28px] border border-white/10 bg-slate-900/80 p-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-white">Categorias cadastradas</h2>
            <p className="mt-2 text-sm text-slate-400">Receitas e despesas separadas para manter o modelo consistente.</p>
          </div>
          <div className="text-sm text-slate-400">{categories.length} categorias</div>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {categories.map((category) => (
            <article key={category.id} className="rounded-3xl border border-white/10 bg-white/5 p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <span className="mt-1 h-3 w-3 rounded-full" style={{ backgroundColor: category.color }} />
                  <div>
                    <h3 className="font-semibold text-white">{category.name}</h3>
                    <p className="mt-1 text-sm text-slate-400">
                      {category.type === TransactionType.INCOME ? "Receita" : "Despesa"} · {category._count.transactions} transações
                    </p>
                  </div>
                </div>

                <Link href={`/categories?edit=${category.id}`} className="text-sm font-medium text-cyan-300 transition hover:text-cyan-200">
                  Editar
                </Link>
              </div>

              <form action={deleteCategoryAction} className="mt-5">
                <input type="hidden" name="id" value={category.id} />
                <button className="rounded-full border border-rose-500/30 bg-rose-500/10 px-4 py-2 text-sm text-rose-200 transition hover:bg-rose-500/20">
                  Excluir
                </button>
              </form>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
