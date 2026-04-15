import Link from "next/link";

import { registerAction } from "@/app/actions";
import { SubmitButton } from "@/components/submit-button";
import { redirectIfAuthenticated } from "@/lib/auth";
import { getSingleParam } from "@/lib/format";

type RegisterPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function RegisterPage({ searchParams }: RegisterPageProps) {
  await redirectIfAuthenticated();
  const params = await searchParams;
  const error = getSingleParam(params.error);

  return (
    <main className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top,#0f766e_0%,#0f172a_40%,#020617_100%)] px-4 py-10 text-slate-50">
      <section className="w-full max-w-xl rounded-[32px] border border-white/10 bg-slate-950/85 p-8 shadow-2xl shadow-teal-950/30 backdrop-blur sm:p-12">
        <span className="inline-flex rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-200">
          Novo cadastro
        </span>

        <div className="mt-6 space-y-3">
          <h1 className="text-4xl font-semibold tracking-tight text-white">Crie seu espaço financeiro.</h1>
          <p className="text-sm leading-7 text-slate-300">
            Em menos de um minuto você entra no app com categorias iniciais prontas para começar a organizar sua rotina.
          </p>
        </div>

        {error ? (
          <div className="mt-6 rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
            {error}
          </div>
        ) : null}

        <form action={registerAction} className="mt-8 space-y-4">
          <label className="block space-y-2">
            <span className="text-sm text-slate-300">Nome</span>
            <input
              name="name"
              required
              minLength={2}
              className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none transition focus:border-emerald-300"
              placeholder="Seu nome"
            />
            <span className="text-xs text-slate-400">Use ao menos 2 caracteres.</span>
          </label>

          <label className="block space-y-2">
            <span className="text-sm text-slate-300">E-mail</span>
            <input
              name="email"
              type="email"
              required
              className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none transition focus:border-emerald-300"
                placeholder="você@exemplo.com"
            />
          </label>

          <label className="block space-y-2">
            <span className="text-sm text-slate-300">Senha</span>
            <input
              name="password"
              type="password"
              required
              minLength={6}
              className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none transition focus:border-emerald-300"
              placeholder="Crie uma senha segura"
            />
          </label>

          <SubmitButton className="w-full rounded-2xl bg-emerald-400 px-4 py-3 font-semibold text-slate-950 transition hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-70">
            Criar conta
          </SubmitButton>
        </form>

        <p className="mt-6 text-sm text-slate-400">
          Já tem conta?{' '}
          <Link href="/login" className="font-semibold text-emerald-300 transition hover:text-emerald-200">
            Fazer login
          </Link>
        </p>
      </section>
    </main>
  );
}
