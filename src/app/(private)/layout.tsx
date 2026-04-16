import Link from "next/link";

import { logoutAction } from "@/app/actions";
import { verifySession } from "@/lib/auth";

const links = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/dashboard/anual", label: "Projeção anual" },
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
    <div className="min-h-screen bg-slate-950 text-slate-50">
      <header className="border-b border-white/10 bg-slate-950/80 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-cyan-300">Finance Flow</p>
            <h1 className="mt-1 text-xl font-semibold text-white">Controle financeiro pessoal</h1>
          </div>

          <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
            <nav className="flex flex-wrap gap-2">
              {links.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="rounded-full border border-white/10 px-4 py-2 text-center text-sm text-slate-300 transition hover:border-cyan-400/40 hover:text-white"
                >
                  {link.label}
                </Link>
              ))}
            </nav>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-center text-sm text-slate-300">
                {session.user.name}
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

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">{children}</main>
    </div>
  );
}
