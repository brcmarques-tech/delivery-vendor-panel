"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useQuery, useMutation, useSubscription } from "@apollo/client";
import { apolloClient } from "@/lib/apollo";
import { GET_MY_PLAN, ACCEPT_TERMS, SESSION_KICKED_SUB } from "@/lib/graphql";
import TermsModal from "@/components/TermsModal";

const navGroups = [
  {
    label: "Principal",
    items: [
      { href: "/dashboard", label: "Visão Geral", icon: "📊" },
      { href: "/dashboard/orders", label: "Pedidos", icon: "📋" },
    ],
  },
  {
    label: "Catálogo",
    items: [
      { href: "/dashboard/products", label: "Produtos", icon: "📦" },
      { href: "/dashboard/promotions", label: "Promoções", icon: "📢" },
      { href: "/dashboard/coupons", label: "Cupons", icon: "🎟️" },
    ],
  },
  {
    label: "Gestão",
    items: [
      { href: "/dashboard/analytics", label: "Analytics", icon: "📈" },
      { href: "/dashboard/plan", label: "Meu Plano", icon: "💎" },
      { href: "/dashboard/support", label: "Suporte", icon: "🆘" },
    ],
  },
  {
    label: "Sistema",
    items: [
      { href: "/dashboard/earnings", label: "Recebimentos", icon: "💰" },
      { href: "/dashboard/settings", label: "Configurações", icon: "⚙️" },
    ],
  },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<{ id?: string; name: string } | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showTerms, setShowTerms] = useState(false);

  const { data: meData } = useQuery(GET_MY_PLAN, {
    skip: !user,
  });
  const [acceptTerms, { loading: acceptingTerms }] = useMutation(ACCEPT_TERMS);

  useEffect(() => {
    const stored = localStorage.getItem("user");
    if (!stored || !localStorage.getItem("token")) {
      router.push("/");
      return;
    }
    const parsed = JSON.parse(stored);
    if (parsed.role !== "VENDOR") {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      router.push("/");
      return;
    }
    setUser(parsed);
  }, [router]);

  // Show terms on first login if not accepted
  useEffect(() => {
    if (meData?.meVendor && !meData.meVendor.acceptedTermsAt) {
      setShowTerms(true);
    }
  }, [meData]);

  // Listen for session kicked via WebSocket
  useSubscription(SESSION_KICKED_SUB, {
    variables: { userId: user?.id, userType: 'vendor' },
    skip: !user?.id,
    onData: () => {
      // Ignore kick events right after forceLogin (same userId gets kicked then logged in)
      if (typeof window !== 'undefined' && (window as any).__justLoggedIn) return;
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      apolloClient.clearStore();
      alert("Sua conta foi conectada em outro dispositivo. Voce foi desconectado.");
      router.push("/");
    },
  });

  // Auto-close sidebar on navigation (mobile)
  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  function handleLogout() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    apolloClient.clearStore();
    router.push("/");
  }

  const sidebarContent = (
    <>
      <div className="p-4 border-b border-[var(--border-light)]">
        <img src="/logo-dark.svg" alt="Delivery" className="h-12" />
        <p className="text-xs text-[var(--text-muted)] mt-1 text-center">Painel do Vendedor</p>
      </div>

      <nav className="flex-1 p-4 space-y-4 overflow-y-auto">
        {navGroups.map((group) => (
          <div key={group.label}>
            <p className="px-4 mb-1 text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">{group.label}</p>
            <div className="space-y-0.5">
              {group.items.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-4 py-2.5 rounded-xl transition ${
                    pathname === item.href
                      ? "bg-orange-50 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 font-semibold"
                      : "text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]"
                  }`}
                >
                  <span>{item.icon}</span>
                  <span className="text-sm">{item.label}</span>
                </Link>
              ))}
            </div>
          </div>
        ))}
      </nav>

      <div className="p-4 border-t border-[var(--border-light)]">
        <p className="text-sm text-[var(--text-secondary)] mb-2">{user?.name}</p>
        <button
          onClick={handleLogout}
          className="text-sm text-red-500 cursor-pointer hover:text-red-600 active:scale-95 transition"
        >
          Sair
        </button>
      </div>
    </>
  );

  async function handleAcceptTerms() {
    try {
      await acceptTerms();
      setShowTerms(false);
    } catch (err: any) {
      alert(err.message);
    }
  }

  return (
    <div className="h-screen overflow-hidden flex bg-[var(--bg-page)]">
      {showTerms && (
        <TermsModal
          type="terms"
          onAccept={handleAcceptTerms}
          loading={acceptingTerms}
          userName={meData?.meVendor?.name}
          userCpf={meData?.meVendor?.cpf}
        />
      )}
      {/* Mobile header */}
      <div className="fixed top-0 left-0 right-0 z-30 flex items-center gap-3 bg-[var(--bg-card)] border-b border-[var(--border-color)] px-4 py-3 md:hidden">
        <button
          onClick={() => setSidebarOpen(true)}
          className="p-1 text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
          aria-label="Abrir menu"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <img src="/logo-dark.svg" alt="Delivery" className="h-8" />
      </div>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Mobile sidebar drawer */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-[var(--bg-sidebar)] border-r border-[var(--border-color)] flex flex-col transform transition-transform duration-200 ease-in-out md:hidden ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Close button */}
        <button
          onClick={() => setSidebarOpen(false)}
          className="absolute top-3 right-3 p-1 text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
          aria-label="Fechar menu"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        {sidebarContent}
      </aside>

      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-64 bg-[var(--bg-sidebar)] border-r border-[var(--border-color)] flex-col shrink-0">
        {sidebarContent}
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto pt-16 md:pt-6 p-4 md:px-10 md:py-8">
        {children}
      </main>
    </div>
  );
}
