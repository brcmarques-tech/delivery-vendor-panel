"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { apolloClient } from "@/lib/apollo";

const navItems = [
  { href: "/dashboard", label: "Visão Geral", icon: "📊" },
  { href: "/dashboard/orders", label: "Pedidos", icon: "📋" },
  { href: "/dashboard/products", label: "Produtos", icon: "📦" },
  { href: "/dashboard/promotions", label: "Promoções", icon: "📢" },
  { href: "/dashboard/plan", label: "Meu Plano", icon: "💎" },
  { href: "/dashboard/settings", label: "Configurações", icon: "⚙️" },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<{ name: string } | null>(null);

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

  function handleLogout() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    apolloClient.clearStore();
    router.push("/");
  }

  return (
    <div className="min-h-screen flex bg-gray-50">
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-6 border-b border-gray-100">
          <h1 className="text-xl font-bold text-orange-500">Delivery</h1>
          <p className="text-sm text-gray-500">Painel do Vendedor</p>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition ${
                pathname === item.href
                  ? "bg-orange-50 text-orange-600 font-semibold"
                  : "text-gray-600 hover:bg-gray-50"
              }`}
            >
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t border-gray-100">
          <p className="text-sm text-gray-600 mb-2">{user?.name}</p>
          <button
            onClick={handleLogout}
            className="text-sm text-red-500 cursor-pointer hover:text-red-600 active:scale-95 transition"
          >
            Sair
          </button>
        </div>
      </aside>

      <main className="flex-1 p-8">{children}</main>
    </div>
  );
}
