"use client";

import { motion } from "framer-motion";
import { fadeIn, staggerContainer, staggerItem } from "@/lib/motion";
import { ChevronDown, Mail, Briefcase, MessageCircle } from "lucide-react";
import PageHeader from "@/components/ui/PageHeader";
import { useTour } from "@/hooks/useTour";
import { type DriveStep } from "driver.js";

const TOUR_STEPS: DriveStep[] = [
  {
    popover: {
      title: "👋 Bem-vindo ao Suporte!",
      description: "Aqui você encontra os canais de atendimento e as perguntas mais frequentes.",
    },
  },
  {
    element: '[data-tour="contact-cards"]',
    popover: {
      title: "Fale conosco",
      description: "Entre em contato por e-mail ou WhatsApp. Nossa equipe responde em horário comercial (Seg-Sex, 9h-18h).",
      side: "bottom",
      align: "start",
    },
  },
  {
    element: '[data-tour="faq-section"]',
    popover: {
      title: "✅ Perguntas frequentes",
      description: "Antes de abrir um chamado, confira se sua dúvida já está respondida aqui. São as perguntas mais comuns.\n\nIsso é tudo! Para rever, clique no ❓ ao lado do título 'Suporte'.",
      side: "top",
      align: "start",
    },
  },
];

export default function SupportPage() {
  const { startTour, hasSeenTour } = useTour("support", TOUR_STEPS);
  return (
    <motion.div {...fadeIn}>
      <PageHeader title="Suporte" description="Precisa de ajuda? Entre em contato com nossa equipe." onTourStart={startTour} tourNotSeen={!hasSeenTour} />

      <motion.div data-tour="contact-cards" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8" variants={staggerContainer} initial="hidden" animate="show">
        {/* Email Suporte */}
        <a
          href="mailto:suporte@bcmtech.com.br"
          className="block bg-[var(--bg-card)] rounded-2xl shadow-[var(--card-shadow)] border border-[var(--border-light)] p-6 hover:shadow-[var(--card-shadow-hover)] transition-shadow group"
        >
          <div className="w-12 h-12 rounded-xl bg-[var(--brand-primary-muted)] flex items-center justify-center mb-4">
            <Mail className="w-6 h-6 text-[var(--brand-primary)]" />
          </div>
          <h3 className="font-semibold text-[var(--text-primary)] mb-1">Email de Suporte</h3>
          <p className="text-sm text-[var(--text-secondary)] mb-3">
            Envie sua duvida ou problema e responderemos o mais rapido possivel.
          </p>
          <span className="text-sm font-medium text-[var(--brand-primary)]">
            suporte@bcmtech.com.br
          </span>
        </a>

        {/* Email Contato */}
        <a
          href="mailto:contato@bcmtech.com.br"
          className="block bg-[var(--bg-card)] rounded-2xl shadow-[var(--card-shadow)] border border-[var(--border-light)] p-6 hover:shadow-[var(--card-shadow-hover)] transition-shadow group"
        >
          <div className="w-12 h-12 rounded-xl bg-[var(--brand-primary-muted)] flex items-center justify-center mb-4">
            <Briefcase className="w-6 h-6 text-[var(--brand-primary)]" />
          </div>
          <h3 className="font-semibold text-[var(--text-primary)] mb-1">Contato Comercial</h3>
          <p className="text-sm text-[var(--text-secondary)] mb-3">
            Parcerias, planos empresariais ou informacoes sobre a plataforma.
          </p>
          <span className="text-sm font-medium text-[var(--brand-primary)]">
            contato@bcmtech.com.br
          </span>
        </a>

        {/* WhatsApp */}
        <a
          href="https://wa.me/5553984424244?text=Ol%C3%A1%2C%20preciso%20de%20ajuda%20com%20o%20painel%20do%20vendedor."
          target="_blank"
          rel="noopener noreferrer"
          className="block bg-[var(--bg-card)] rounded-2xl shadow-[var(--card-shadow)] border border-[var(--border-light)] p-6 hover:shadow-[var(--card-shadow-hover)] transition-shadow group"
        >
          <div className="w-12 h-12 rounded-xl bg-[var(--brand-primary-muted)] flex items-center justify-center mb-4">
            <MessageCircle className="w-6 h-6 text-[var(--brand-primary)]" />
          </div>
          <h3 className="font-semibold text-[var(--text-primary)] mb-1">WhatsApp</h3>
          <p className="text-sm text-[var(--text-secondary)] mb-3">
            Atendimento rapido pelo WhatsApp.
          </p>
          <span className="text-sm font-medium text-[var(--brand-primary)]">
            (53) 98442-4244
          </span>
        </a>
      </motion.div>

      {/* FAQ */}
      <motion.div data-tour="faq-section" className="bg-[var(--bg-card)] rounded-2xl shadow-[var(--card-shadow)] border border-[var(--border-light)] p-6" {...fadeIn}>
        <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4">Perguntas Frequentes</h2>
        <div className="space-y-4">
          {[
            {
              q: "Como altero meu plano?",
              a: 'Acesse "Meu Plano" no menu lateral para ver os planos disponiveis e fazer upgrade.',
            },
            {
              q: "Como configuro meu pagamento?",
              a: 'Va em "Configuracoes" e acesse a secao "Pagamento" para configurar sua conta.',
            },
            {
              q: "Como adiciono produtos?",
              a: 'Acesse "Produtos" no menu lateral. Voce pode adicionar produtos manualmente ou usar o cadastro rapido.',
            },
            {
              q: "Como funciona a comissao da plataforma?",
              a: "A comissao e definida pelo seu plano. O valor e descontado automaticamente de cada venda. Consulte os detalhes em Meu Plano.",
            },
            {
              q: "Minha loja nao aparece no app, o que fazer?",
              a: "Verifique se sua loja esta ativa nas configuracoes. Lojas sem produtos ou com cadastro incompleto podem nao aparecer.",
            },
          ].map((item, i) => (
            <details key={i} className="group">
              <summary className="cursor-pointer list-none flex items-center justify-between py-3 px-4 rounded-xl hover:bg-[var(--bg-hover)] transition">
                <span className="font-medium text-[var(--text-primary)]">{item.q}</span>
                <ChevronDown className="w-5 h-5 text-[var(--text-muted)] group-open:rotate-180 transition-transform" strokeWidth={2} />
              </summary>
              <p className="text-sm text-[var(--text-secondary)] px-4 pb-3 leading-relaxed">
                {item.a}
              </p>
            </details>
          ))}
        </div>
      </motion.div>

      {/* Horario */}
      <div className="mt-6 text-center">
        <p className="text-sm text-[var(--text-muted)]">
          Horario de atendimento: Segunda a Sexta, 9h as 18h
        </p>
      </div>
    </motion.div>
  );
}
