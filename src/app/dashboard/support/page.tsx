"use client";

export default function SupportPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-2">Suporte</h1>
      <p className="text-[var(--text-secondary)] mb-8">
        Precisa de ajuda? Entre em contato com nossa equipe.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {/* Email Suporte */}
        <a
          href="mailto:suporte@bcmtech.com.br"
          className="block bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl p-6 hover:border-orange-300 hover:shadow-md transition group"
        >
          <div className="w-12 h-12 bg-orange-50 rounded-xl flex items-center justify-center mb-4 group-hover:bg-orange-100 transition">
            <span className="text-2xl">📧</span>
          </div>
          <h3 className="font-semibold text-[var(--text-primary)] mb-1">Email de Suporte</h3>
          <p className="text-sm text-[var(--text-secondary)] mb-3">
            Envie sua duvida ou problema e responderemos o mais rapido possivel.
          </p>
          <span className="text-sm font-medium text-orange-600">
            suporte@bcmtech.com.br
          </span>
        </a>

        {/* Email Contato */}
        <a
          href="mailto:contato@bcmtech.com.br"
          className="block bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl p-6 hover:border-blue-300 hover:shadow-md transition group"
        >
          <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center mb-4 group-hover:bg-blue-100 transition">
            <span className="text-2xl">💼</span>
          </div>
          <h3 className="font-semibold text-[var(--text-primary)] mb-1">Contato Comercial</h3>
          <p className="text-sm text-[var(--text-secondary)] mb-3">
            Parcerias, planos empresariais ou informacoes sobre a plataforma.
          </p>
          <span className="text-sm font-medium text-blue-600">
            contato@bcmtech.com.br
          </span>
        </a>

        {/* WhatsApp placeholder */}
        <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl p-6 opacity-60">
          <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center mb-4">
            <span className="text-2xl">💬</span>
          </div>
          <h3 className="font-semibold text-[var(--text-primary)] mb-1">WhatsApp</h3>
          <p className="text-sm text-[var(--text-secondary)] mb-3">
            Atendimento por WhatsApp em breve.
          </p>
          <span className="text-sm font-medium text-[var(--text-muted)]">
            Em breve
          </span>
        </div>
      </div>

      {/* FAQ */}
      <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl p-6">
        <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4">Perguntas Frequentes</h2>
        <div className="space-y-4">
          {[
            {
              q: "Como altero meu plano?",
              a: 'Acesse "Meu Plano" no menu lateral para ver os planos disponiveis e fazer upgrade.',
            },
            {
              q: "Como conecto meu Mercado Pago?",
              a: 'Va em "Configuracoes" e clique em "Conectar Mercado Pago" na secao de pagamentos.',
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
                <svg
                  className="w-5 h-5 text-[var(--text-muted)] group-open:rotate-180 transition-transform"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </summary>
              <p className="text-sm text-[var(--text-secondary)] px-4 pb-3 leading-relaxed">
                {item.a}
              </p>
            </details>
          ))}
        </div>
      </div>

      {/* Horario */}
      <div className="mt-6 text-center">
        <p className="text-sm text-[var(--text-muted)]">
          Horario de atendimento: Segunda a Sexta, 9h as 18h
        </p>
      </div>
    </div>
  );
}
