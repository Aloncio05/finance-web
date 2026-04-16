import Link from "next/link";
import { notFound } from "next/navigation";

import { resetPasswordAction } from "@/app/actions";
import { SubmitButton } from "@/components/submit-button";
import { redirectIfAuthenticated } from "@/lib/auth";
import { getSingleParam } from "@/lib/format";
import { prisma } from "@/lib/prisma";

import crypto from "node:crypto";

export const dynamic = "force-dynamic";

type PasswordResetTokenLookup = {
  user: {
    email: string;
  };
};

type PasswordResetTokenClient = {
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
          email: true;
        };
      };
    };
  }): Promise<PasswordResetTokenLookup | null>;
};

const passwordResetTokens = (prisma as typeof prisma & { passwordResetToken: PasswordResetTokenClient })
  .passwordResetToken;

type ResetPasswordPageProps = {
  params: Promise<{
    token: string;
  }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function hashOneTimeToken(token: string) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export default async function ResetPasswordPage({ params, searchParams }: ResetPasswordPageProps) {
  await redirectIfAuthenticated();
  const { token } = await params;
  const query = await searchParams;
  const error = getSingleParam(query.error);

  if (!token) {
    notFound();
  }

  const passwordResetToken = await passwordResetTokens.findFirst({
    where: {
      tokenHash: hashOneTimeToken(token),
      usedAt: null,
      expiresAt: {
        gt: new Date(),
      },
    },
    include: {
      user: {
        select: {
          email: true,
        },
      },
    },
  });

  if (!passwordResetToken) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top,#1e293b_0%,#0f172a_40%,#020617_100%)] px-4 py-10 text-slate-50">
        <section className="w-full max-w-xl rounded-[32px] border border-white/10 bg-slate-950/85 p-8 shadow-2xl shadow-slate-950/30 backdrop-blur sm:p-12">
          <span className="inline-flex rounded-full border border-amber-400/30 bg-amber-400/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-amber-200">
            Link inválido
          </span>
          <h1 className="mt-6 text-3xl font-semibold text-white">Este link não pode mais ser usado.</h1>
          <p className="mt-4 text-sm leading-7 text-slate-300">
            O token expirou, já foi utilizado ou não existe. Gere um novo link para redefinir sua senha.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/forgot-password" className="rounded-full bg-cyan-400 px-4 py-2 font-semibold text-slate-950 transition hover:bg-cyan-300">
              Gerar novo link
            </Link>
            <Link href="/login" className="rounded-full border border-white/10 px-4 py-2 font-semibold text-white transition hover:border-cyan-300/40 hover:text-cyan-200">
              Voltar ao login
            </Link>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top,#1d4ed8_0%,#0f172a_40%,#020617_100%)] px-4 py-10 text-slate-50">
      <section className="w-full max-w-xl rounded-[32px] border border-white/10 bg-slate-950/85 p-8 shadow-2xl shadow-blue-950/30 backdrop-blur sm:p-12">
        <span className="inline-flex rounded-full border border-violet-400/30 bg-violet-400/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-violet-200">
          Nova senha
        </span>

        <div className="mt-6 space-y-3">
          <h1 className="text-4xl font-semibold tracking-tight text-white">Defina sua nova senha.</h1>
          <p className="text-sm leading-7 text-slate-300">
            Conta: <strong className="text-white">{passwordResetToken.user.email}</strong>
          </p>
        </div>

        {error ? (
          <div className="mt-6 rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
            {error}
          </div>
        ) : null}

        <form action={resetPasswordAction} className="mt-8 space-y-4">
          <input type="hidden" name="token" value={token} />

          <label className="block space-y-2">
            <span className="text-sm text-slate-300">Nova senha</span>
            <input
              name="password"
              type="password"
              minLength={6}
              required
              className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none transition focus:border-violet-300"
              placeholder="Crie uma nova senha"
            />
          </label>

          <label className="block space-y-2">
            <span className="text-sm text-slate-300">Confirmar nova senha</span>
            <input
              name="confirmPassword"
              type="password"
              minLength={6}
              required
              className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none transition focus:border-violet-300"
              placeholder="Repita a nova senha"
            />
          </label>

          <SubmitButton className="w-full rounded-2xl bg-violet-400 px-4 py-3 font-semibold text-slate-950 transition hover:bg-violet-300 disabled:cursor-not-allowed disabled:opacity-70">
            Salvar nova senha
          </SubmitButton>
        </form>

        <p className="mt-6 text-sm text-slate-400">
          Não quer continuar?{" "}
          <Link href="/login" className="font-semibold text-violet-300 transition hover:text-violet-200">
            Voltar ao login
          </Link>
        </p>
      </section>
    </main>
  );
}
