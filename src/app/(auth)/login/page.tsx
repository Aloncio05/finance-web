import Link from "next/link";

import { loginAction } from "@/app/actions";
import { SubmitButton } from "@/components/submit-button";
import { redirectIfAuthenticated } from "@/lib/auth";
import { getSingleParam } from "@/lib/format";

type LoginPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  await redirectIfAuthenticated();
  const params = await searchParams;
  const error = getSingleParam(params.error);
  const success = getSingleParam(params.success);

  return (
    <main className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top,#1d4ed8_0%,#0f172a_40%,#020617_100%)] px-4 py-10 text-slate-50">
      <section className="grid w-full max-w-5xl overflow-hidden rounded-[32px] border border-white/10 bg-slate-950/70 shadow-2xl shadow-blue-950/30 backdrop-blur sm:grid-cols-[1.2fr,0.8fr]">
        <div className="flex flex-col justify-between gap-8 p-8 sm:p-12">
          <div className="space-y-6">
            <span className="inline-flex w-fit rounded-full border border-cyan-400/30 bg-cyan-400/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-cyan-200">
              Finance Flow
            </span>
            <div className="space-y-4">
              <h1 className="max-w-lg text-4xl font-semibold tracking-tight text-white sm:text-5xl">
                Seu controle financeiro com foco em clareza, ritmo e decisão.
              </h1>
              <p className="max-w-xl text-base leading-7 text-slate-300">
                Entre para acompanhar receitas, despesas e o saldo do mês em um painel simples para usar no dia a dia.
              </p>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <article className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-sm text-slate-400">Resumo mensal</p>
              <strong className="mt-3 block text-2xl font-semibold text-white">360°</strong>
            </article>
            <article className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-sm text-slate-400">Categorias</p>
              <strong className="mt-3 block text-2xl font-semibold text-white">Flexíveis</strong>
            </article>
            <article className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-sm text-slate-400">Acesso</p>
              <strong className="mt-3 block text-2xl font-semibold text-white">Seguro</strong>
            </article>
          </div>
        </div>

        <div className="border-t border-white/10 bg-slate-950/90 p-8 sm:border-t-0 sm:border-l sm:p-12">
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-semibold text-white">Entrar</h2>
              <p className="mt-2 text-sm text-slate-400">Use seu e-mail para acessar o painel.</p>
            </div>

            {success ? (
              <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
                {success}
              </div>
            ) : null}

            {error ? (
              <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
                {error}
              </div>
            ) : null}

            <form action={loginAction} className="space-y-4">
              <label className="block space-y-2">
                <span className="text-sm text-slate-300">E-mail</span>
                <input
                  name="email"
                  type="email"
                  required
                  className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none transition focus:border-cyan-300"
                  placeholder="você@exemplo.com"
                />
              </label>

              <label className="block space-y-2">
                <span className="text-sm text-slate-300">Senha</span>
                <input
                  name="password"
                  type="password"
                  required
                  className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none transition focus:border-cyan-300"
                  placeholder="••••••••"
                />
              </label>

              <SubmitButton className="w-full rounded-2xl bg-cyan-400 px-4 py-3 font-semibold text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-70">
                Acessar painel
              </SubmitButton>
            </form>

            <p className="text-sm text-slate-400">
              Ainda não tem conta?{' '}
              <Link href="/register" className="font-semibold text-cyan-300 transition hover:text-cyan-200">
                Criar agora
              </Link>
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
