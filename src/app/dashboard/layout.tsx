"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, useMemo } from "react";
import { useQuery, useMutation, useSubscription } from "@apollo/client";
import { apolloClient } from "@/lib/apollo";
import { GET_MY_PLAN, GET_MY_STORES, GET_AVAILABLE_PLANS, ACCEPT_TERMS, SESSION_KICKED, MINHAS_EQUIPES } from "@/lib/graphql";
import TermsModal from "@/components/TermsModal";
import {
  LayoutDashboard, ClipboardList, CalendarCheck, Package, Briefcase,
  Megaphone, Ticket, BarChart3, Crown, LifeBuoy, Wallet, Settings,
  Menu, X, LogOut, Lock, Plus, ArrowRight, Users,
} from "lucide-react";

// Requisitos por rota: storeType = precisa de loja desse tipo, feature = precisa
// que o plano libere esse recurso.
type PlanFeature = 'analytics' | 'coupons' | 'promotions';
const ROUTE_REQUIREMENTS: Record<string, { storeType?: 'PRODUCTS' | 'SERVICES'; feature?: PlanFeature }> = {
  "/dashboard/orders":       { storeType: "PRODUCTS" },
  "/dashboard/appointments": { storeType: "SERVICES" },
  "/dashboard/analytics":    { feature: "analytics" },
  "/dashboard/promotions":   { feature: "promotions" },
  "/dashboard/coupons":      { feature: "coupons" },
};

// Fallback usado só enquanto `availablePlans` não respondeu — a fonte da verdade
// são as flags do plano, que o superadmin edita em tempo de execução.
const PAID_PLANS = ["PRO", "PREMIUM", "ENTERPRISE", "CUSTOM"];

/**
 * KAN-82 — qual MÓDULO da equipe cada rota exige.
 *
 * Isto é só a aparência do menu: a autorização de verdade está no servidor,
 * que recusa a operação mesmo se alguém digitar a URL. Esconder o item serve
 * para o funcionário não clicar em algo que vai ser negado — e para ele não
 * ficar sabendo o que a loja tem e ele não pode ver.
 */
const ROTA_PARA_MODULO: Record<string, string> = {
  "/dashboard/orders": "ORDERS",
  "/dashboard/appointments": "ORDERS",
  "/dashboard/products": "PRODUCTS",
  "/dashboard/services": "PRODUCTS",
  "/dashboard/promotions": "PROMOTIONS",
  "/dashboard/coupons": "COUPONS",
  "/dashboard/analytics": "REPORTS",
  "/dashboard/earnings": "EARNINGS",
  "/dashboard/settings": "SETTINGS",
  "/dashboard/plan": "SETTINGS",
};

const NAV_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  "/dashboard": LayoutDashboard,
  "/dashboard/orders": ClipboardList,
  "/dashboard/appointments": CalendarCheck,
  "/dashboard/products": Package,
  "/dashboard/services": Briefcase,
  "/dashboard/promotions": Megaphone,
  "/dashboard/coupons": Ticket,
  "/dashboard/analytics": BarChart3,
  "/dashboard/plan": Crown,
  "/dashboard/support": LifeBuoy,
  "/dashboard/earnings": Wallet,
  "/dashboard/settings": Settings,
  "/dashboard/equipe": Users,
};

function buildNavGroups() {
  return [
    {
      label: "Principal",
      items: [
        { href: "/dashboard", label: "Visao Geral" },
        { href: "/dashboard/orders", label: "Pedidos" },
        { href: "/dashboard/appointments", label: "Agendamentos" },
      ],
    },
    {
      label: "Catalogo",
      items: [
        { href: "/dashboard/products", label: "Produtos" },
        { href: "/dashboard/services", label: "Servicos" },
        { href: "/dashboard/promotions", label: "Promocoes" },
        { href: "/dashboard/coupons", label: "Cupons" },
      ],
    },
    {
      label: "Gestao",
      items: [
        { href: "/dashboard/analytics", label: "Analytics" },
        { href: "/dashboard/plan", label: "Meu Plano" },
        { href: "/dashboard/support", label: "Suporte" },
      ],
    },
    {
      label: "Sistema",
      items: [
        { href: "/dashboard/earnings", label: "Recebimentos" },
        { href: "/dashboard/equipe", label: "Equipe" },
        { href: "/dashboard/settings", label: "Configuracoes" },
      ],
    },
  ];
}

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
  const [lockedPopover, setLockedPopover] = useState<string | null>(null);
  const [popoverY, setPopoverY] = useState(0);

  const { data: meData } = useQuery(GET_MY_PLAN, {
    skip: !user,
  });
  const { data: storesData } = useQuery(GET_MY_STORES, {
    skip: !user,
  });
  const { data: plansData } = useQuery(GET_AVAILABLE_PLANS, {
    skip: !user,
  });
  const [acceptTerms, { loading: acceptingTerms }] = useMutation(ACCEPT_TERMS);
  // KAN-82: as lojas em que SOU MEMBRO (não dono). Quem é dono não tem vínculo
  // nenhum aqui — e por isso continua vendo tudo.
  const { data: equipesData } = useQuery(MINHAS_EQUIPES, { skip: !user });

  // KAN-280: quando alguem loga na mesma conta em outro lugar (forceLogin), o
  // servidor derruba esta sessao. Sem a assinatura, o painel do balcao apenas
  // comecava a dar SESSION_EXPIRED em toda acao, sem explicacao — agora avisa e
  // volta ao login de forma limpa.
  useSubscription(SESSION_KICKED, {
    variables: { userId: user?.id ?? "", userType: "vendor" },
    skip: !user?.id,
    onData: () => {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      alert("Sua conta foi conectada em outro dispositivo. Você foi desconectado deste painel.");
      window.location.href = "/";
    },
  });

  const navGroups = useMemo(() => buildNavGroups(), []);


  const stores: any[] = storesData?.myStores || [];
  // Dono de alguma das lojas listadas? `myStores` passou a incluir as lojas
  // em que o usuário é MEMBRO (KAN-82), então "tenho loja" deixou de significar
  // "sou dono".
  const temLojaPropria = stores.some((s: any) => s.owner?.id === user?.id);

  // KAN-82: o menu do FUNCIONÁRIO mostra só os módulos liberados.
  //
  // A regra: quem tem loja própria é dono e vê tudo (o vínculo de equipe é
  // adicional). Quem só tem vínculo vê a união das permissões dos vínculos
  // aceitos — união, e não interseção, porque o item do menu leva a uma tela
  // que já escolhe a loja; esconder o Pedidos de quem despacha numa loja só
  // porque na outra ele não pode seria pior.
  const vinculos: any[] = equipesData?.minhasEquipes || [];
  const vinculosAceitos = vinculos.filter((v) => v.acceptedAt);
  const souSomenteMembro = vinculosAceitos.length > 0 && !temLojaPropria;
  const modulosLiberados = new Set<string>(
    vinculosAceitos.flatMap((v) => v.permissions || []),
  );
  const podeGerenciarEquipe =
    !souSomenteMembro || vinculosAceitos.some((v) => v.role === "MANAGER");
  const moduloVisivel = (href: string): boolean => {
    if (!souSomenteMembro) return true;
    if (href === "/dashboard") return true; // a visão geral é a porta de entrada
    if (href === "/dashboard/support") return true;
    if (href === "/dashboard/equipe") return podeGerenciarEquipe;
    const modulo = ROTA_PARA_MODULO[href];
    if (!modulo) return true;
    return modulosLiberados.has(modulo);
  };
  const hasProductStore = stores.some((s) => s.storeType === "PRODUCTS");
  const hasServiceStore = stores.some((s) => s.storeType === "SERVICES");
  const isPaidPlan = PAID_PLANS.includes(meData?.meVendor?.vendorPlan || "");
  const currentPlanName: string = meData?.meVendor?.vendorPlan || "FREE";
  const currentPlanConfig = plansData?.availablePlans?.find((p: any) => p.plan === currentPlanName);

  // O menu liberava Analytics/Cupons/Promoções por NOME de plano, mas o servidor
  // decide por flag (`hasAnalytics`, `canUseCoupons`, `freePromosPerWeek > 0`).
  // No CUSTOM as duas visões se contradiziam: o nome está na lista de pagos, mas
  // as flags são todas falsas — o menu abria, o vendedor preenchia o formulário
  // inteiro e só levava "Seu plano nao permite criar cupons" ao salvar. E como o
  // superadmin edita essas flags em runtime, qualquer ajuste lá deixava o menu
  // desatualizado. Agora lemos as mesmas flags; a lista de nomes só cobre o
  // intervalo em que a query ainda não respondeu.
  const featureAllowed = (feature: PlanFeature): boolean => {
    if (!currentPlanConfig) return isPaidPlan;
    if (feature === "analytics") return !!currentPlanConfig.hasAnalytics;
    if (feature === "coupons") return !!currentPlanConfig.canUseCoupons;
    return (currentPlanConfig.freePromosPerWeek ?? 0) > 0;
  };
  const maxStores: number = currentPlanConfig?.maxStores ?? 1;
  const atStoreLimit = stores.length >= maxStores;

  useEffect(() => {
    const stored = localStorage.getItem("user");
    if (!stored || !localStorage.getItem("token")) {
      router.replace("/");
      return;
    }
    // BUGFIX: JSON.parse sem guarda. Um `user` corrompido no localStorage
    // (quota, escrita abortada, formato antigo) lancava DENTRO do efeito do
    // layout e derrubava TODA rota /dashboard/* — inclusive a sidebar com o
    // botao Sair, entao o usuario nem conseguia deslogar para limpar.
    let parsed: any;
    try {
      parsed = JSON.parse(stored);
    } catch {
      localStorage.removeItem('user');
      localStorage.removeItem('token');
      router.replace('/');
      return;
    }
    if (parsed.role !== "VENDOR") {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      router.replace("/");
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

  // Auto-close sidebar on navigation (mobile)
  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  // Fecha popover ao navegar
  useEffect(() => {
    setLockedPopover(null);
  }, [pathname]);

  function handleLogout() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    apolloClient.clearStore();
    router.replace("/");
  }

  const sidebarContent = (
    <>
      <div className="p-4 border-b border-[var(--border-light)]">
        <Link href="/dashboard"><img src="/logo-dark.svg" alt="Shopping" className="h-[72px] mx-auto" /></Link>
      </div>

      <nav className="flex-1 px-3 py-3 space-y-3 overflow-y-auto scrollbar-none" style={{ scrollbarWidth: 'none' }}>
        {navGroups.map((group, gi) => (
          <div key={group.label} className={gi > 0 ? 'pt-2' : ''}>
            <p className="px-3 mb-2 text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">{group.label}</p>
            <div className="space-y-1">
              {group.items.filter((item) => moduloVisivel(item.href)).map((item) => {
                const Icon = NAV_ICONS[item.href];
                const active = pathname === item.href;
                const req = ROUTE_REQUIREMENTS[item.href];

                // Lock por falta de loja — não clicável
                const storeBlocked = req?.storeType
                  ? req.storeType === "PRODUCTS" ? !hasProductStore : !hasServiceStore
                  : false;

                // Lock por plano — clicável (vai para /dashboard/plan)
                const planBlocked = req?.feature ? !featureAllowed(req.feature) : false;

                if (storeBlocked) {
                  const storeType = req?.storeType === "PRODUCTS" ? "produtos" : "servicos";
                  const isOpen = lockedPopover === item.href;
                  return (
                    <div key={item.href} className="relative">
                      <div className="flex items-center gap-3 px-3 py-2 rounded-xl opacity-50 cursor-default select-none">
                        {Icon && <Icon className="w-5 h-5 shrink-0 text-[var(--text-muted)]" />}
                        <span className="text-sm text-[var(--text-secondary)] flex-1">{item.label}</span>
                        <button
                          onClick={(e) => { setLockedPopover(isOpen ? null : item.href); setPopoverY(e.currentTarget.getBoundingClientRect().top); }}
                          className="p-0.5 rounded-md hover:bg-[var(--bg-hover)] transition opacity-100 cursor-pointer"
                        >
                          <Lock className="w-3.5 h-3.5 text-[var(--text-muted)]" />
                        </button>
                      </div>
                      {isOpen && (
                        <div className="fixed left-[17rem] z-[9999] w-56 bg-[var(--bg-card)] border border-[var(--border-light)] rounded-2xl shadow-2xl p-4" style={{ top: `${popoverY - 20}px` }}>
                          {/* Flechinha apontando para o cadeado */}
                          <div className="absolute -left-2 top-6 w-0 h-0 border-t-[8px] border-t-transparent border-b-[8px] border-b-transparent border-r-[8px] border-r-[var(--bg-card)]" />

                          <p className="text-xs font-semibold text-[var(--text-primary)] mb-1">
                            Loja de {storeType} necessaria
                          </p>
                          <p className="text-xs text-[var(--text-muted)] mb-3 leading-relaxed">
                            Crie uma loja do tipo {storeType} para acessar esta area.
                          </p>
                          {atStoreLimit ? (
                            <Link
                              href="/dashboard/plan"
                              onClick={() => setLockedPopover(null)}
                              className="flex items-center justify-between gap-2 w-full px-3 py-2 rounded-xl bg-[#ffd700]/10 text-[#b8860b] dark:text-[#ffd700] text-xs font-semibold hover:opacity-80 transition"
                            >
                              <Crown className="w-3.5 h-3.5 shrink-0" />
                              Fazer upgrade de plano
                              <ArrowRight className="w-3.5 h-3.5 shrink-0" />
                            </Link>
                          ) : (
                            <Link
                              href="/dashboard/settings"
                              onClick={() => setLockedPopover(null)}
                              className="flex items-center justify-between gap-2 w-full px-3 py-2 rounded-xl bg-[var(--brand-primary)] text-white text-xs font-semibold hover:bg-[var(--brand-primary-hover)] transition"
                            >
                              <Plus className="w-3.5 h-3.5 shrink-0" />
                              Criar loja de {storeType}
                              <ArrowRight className="w-3.5 h-3.5 shrink-0" />
                            </Link>
                          )}
                        </div>
                      )}
                    </div>
                  );
                }

                if (planBlocked) {
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`group flex items-center gap-3 px-3 py-2 rounded-xl transition-all duration-150 relative ${
                        active
                          ? "bg-[var(--brand-primary-light)] text-[var(--brand-primary)] font-semibold shadow-sm"
                          : "text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]"
                      }`}
                    >
                      {active && (
                        <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 rounded-r-full bg-[var(--brand-primary)]" />
                      )}
                      {Icon && <Icon className={`w-5 h-5 shrink-0 ${active ? '' : 'text-[var(--text-muted)] group-hover:text-[var(--text-secondary)]'}`} />}
                      <span className="text-sm flex-1">{item.label}</span>
                      <Crown className="w-3.5 h-3.5 shrink-0 text-[#b8860b] dark:text-[#ffd700]" />
                    </Link>
                  );
                }

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`group flex items-center gap-3 px-3 py-2 rounded-xl transition-all duration-150 relative ${
                      active
                        ? "bg-[var(--brand-primary-light)] text-[var(--brand-primary)] font-semibold shadow-sm"
                        : "text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]"
                    }`}
                  >
                    {active && (
                      <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 rounded-r-full bg-[var(--brand-primary)]" />
                    )}
                    {Icon && <Icon className={`w-5 h-5 shrink-0 ${active ? '' : 'text-[var(--text-muted)] group-hover:text-[var(--text-secondary)]'}`} />}
                    <span className="text-sm">{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="p-4 border-t border-[var(--border-light)]">
        <Link
          href="/dashboard/profile"
          className={`flex items-center gap-3 mb-3 p-1.5 -m-1.5 rounded-xl transition ${
            pathname === "/dashboard/profile"
              ? "bg-[var(--brand-primary-light)]"
              : "hover:bg-[var(--bg-hover)]"
          }`}
        >
          <div className="w-9 h-9 rounded-full bg-[var(--brand-primary)] flex items-center justify-center text-white text-sm font-bold shrink-0">
            {user?.name?.charAt(0)?.toUpperCase() || '?'}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-[var(--text-primary)] truncate">{user?.name}</p>
            <p className="text-xs text-[var(--text-muted)]">Vendedor</p>
          </div>
          <Settings className="w-4 h-4 text-[var(--text-muted)] shrink-0" />
        </Link>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 text-sm text-[var(--text-muted)] cursor-pointer hover:text-[var(--status-error-text)] active:scale-95 transition w-full px-1"
        >
          <LogOut className="w-4 h-4" />
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
          <Menu className="h-6 w-6" />
        </button>
        <img src="/logo-dark.svg" alt="Shopping" className="h-8" />
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
          <X className="h-5 w-5" />
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
