import Link from "next/link";

import { forgotPasswordAction } from "@/app/actions";
import { SubmitButton } from "@/components/submit-button";
import { redirectIfAuthenticated } from "@/lib/auth";
import { getSingleParam } from "@/lib/format";

export const dynamic = "force-dynamic";

type ForgotPasswordPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function ForgotPasswordPage({ searchParams }: ForgotPasswordPageProps) {
  await redirectIfAuthenticated();
  const params = await searchParams;
  const error = getSingleParam(params.error);
  const success = getSingleParam(params.success);
  const resetLink = getSingleParam(params.resetLink);

  return (
    <main className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top,#0f766e_0%,#0f172a_40%,#020617_100%)] px-4 py-10 text-slate-50">
      <section className="w-full max-w-xl rounded-[32px] border border-white/10 bg-slate-950/85 p-8 shadow-2xl shadow-teal-950/30 backdrop-blur sm:p-12">
        <span className="inline-flex rounded-full border border-cyan-400/30 bg-cyan-400/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-cyan-200">
          Recuperar acesso
        </span>

        <div className="mt-6 space-y-3">
          <h1 className="text-4xl font-semibold tracking-tight text-white">Redefina sua senha.</h1>
          <p className="text-sm leading-7 text-slate-300">
            Informe o e-mail da conta. No uso local, o app gera o link na tela. Em ambientes públicos, o envio precisa estar configurado antes de liberar a redefinição.
          </p>
        </div>

        {success ? (
          <div className="mt-6 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
            {success}
          </div>
        ) : null}

        {error ? (
          <div className="mt-6 rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
            {error}
          </div>
        ) : null}

        {resetLink ? (
          <div className="mt-6 rounded-2xl border border-cyan-400/30 bg-cyan-400/10 p-4 text-sm text-cyan-100">
            <p className="font-medium text-white">Link gerado para este ambiente local</p>
            <p className="mt-2 break-all">{resetLink}</p>
            <Link href={resetLink} className="mt-4 inline-flex rounded-full border border-cyan-300/30 px-4 py-2 font-semibold text-cyan-100 transition hover:bg-cyan-400/10">
              Abrir redefinição agora
            </Link>
          </div>
        ) : null}

        <form action={forgotPasswordAction} className="mt-8 space-y-4">
          <label className="block space-y-2">
            <span className="text-sm text-slate-300">E-mail da conta</span>
            <input
              name="email"
              type="email"
              required
              className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none transition focus:border-cyan-300"
              placeholder="voce@exemplo.com"
            />
          </label>

          <SubmitButton className="w-full rounded-2xl bg-cyan-400 px-4 py-3 font-semibold text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-70">
            Gerar link de redefinição
          </SubmitButton>
        </form>

        <p className="mt-6 text-sm text-slate-400">
          Lembrou da senha?{" "}
          <Link href="/login" className="font-semibold text-cyan-300 transition hover:text-cyan-200">
            Voltar ao login
          </Link>
        </p>
      </section>
    </main>
  );
}
