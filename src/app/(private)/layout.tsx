import Link from "next/link";

import { logoutAction } from "@/app/actions";
import { verifySession } from "@/lib/auth";

const links = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/dashboard/anual", label: "Visão anual" },
  { href: "/transactions", label: "Transações" },
  { href: "/categories", label: "Categorias" },
];

export default async function PrivateLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await verifySession();

  return (
    <div className="min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top_left,rgba(14,165,233,0.18),transparent_34%),linear-gradient(180deg,#020617_0%,#0f172a_48%,#111827_100%)] text-slate-50">
      <a className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-full focus:bg-cyan-300 focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-slate-950" href="#content">
        Ir para o conteúdo
      </a>
      <header className="sticky top-0 z-40 border-b border-white/10 bg-slate-950/75 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-cyan-300/30 bg-cyan-300/10 text-lg font-black text-cyan-200 shadow-lg shadow-cyan-950/40">
              F
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.32em] text-cyan-300">Finance Flow</p>
              <h1 className="mt-1 text-xl font-semibold text-white">Controle financeiro pessoal</h1>
            </div>
          </div>

          <div className="flex flex-col gap-4 xl:flex-row xl:items-center">
            <nav className="flex flex-wrap gap-2 rounded-full border border-white/10 bg-white/[0.04] p-1 shadow-inner shadow-slate-950/30">
              {links.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="rounded-full px-4 py-2 text-center text-sm font-medium text-slate-300 transition hover:bg-cyan-400/10 hover:text-white"
                >
                  {link.label}
                </Link>
              ))}
            </nav>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="rounded-full border border-white/10 bg-white/[0.06] px-4 py-2 text-center text-sm text-slate-300 shadow-sm shadow-slate-950/20">
                <span className="text-slate-500">Olá, </span>{session.user.name}
              </div>
              <form action={logoutAction}>
                <button className="w-full rounded-full border border-rose-500/30 bg-rose-500/10 px-4 py-2 text-sm font-medium text-rose-200 transition hover:bg-rose-500/20 sm:w-auto">
                  Sair
                </button>
              </form>
            </div>
          </div>
        </div>
      </header>

      <main id="content" className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">{children}</main>
    </div>
  );
}
