import { Store, Check } from "lucide-react";

export default function AuthBrandingPanel({ step }: { step?: 1 | 2 | 3 }) {
  return (
    <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-orange-500 to-orange-600 dark:from-orange-600 dark:to-orange-700 items-center justify-center p-12 relative overflow-hidden">
      {/* Decorative circles */}
      <div className="absolute top-[-80px] right-[-80px] w-64 h-64 rounded-full bg-white/10" />
      <div className="absolute bottom-[-60px] left-[-60px] w-48 h-48 rounded-full bg-white/10" />
      <div className="absolute top-1/2 left-[-30px] w-24 h-24 rounded-full bg-white/5" />

      <div className="text-center text-white max-w-md relative z-10">
        <div className="w-20 h-20 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-8">
          <Store className="w-10 h-10" />
        </div>
        <h1 className="text-4xl font-bold mb-4">bcmTech Shopping</h1>
        <p className="text-lg text-white/80 mb-8">
          {step ? "Cadastre sua loja e comece a vender para milhares de clientes." : "Gerencie sua loja, pedidos e pagamentos em um so lugar."}
        </p>

        {step && (
          <div className="flex items-center justify-center gap-3 mb-8">
            {[1, 2, 3].map((s) => (
              <div key={s} className="flex items-center gap-3">
                {s > 1 && <div className={`w-8 h-0.5 ${s <= step ? "bg-white" : "bg-white/30"}`} />}
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold
                  ${s < step ? "bg-white text-orange-500" : s === step ? "bg-white/20 text-white border-2 border-white" : "bg-white/10 text-white/50"}`}>
                  {s < step ? (
                    <Check className="w-4 h-4" strokeWidth={2.5} />
                  ) : s}
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="space-y-4 text-left">
          <div className="flex items-center gap-3 text-white/90">
            <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center flex-shrink-0">
              <Check className="w-4 h-4" strokeWidth={2} />
            </div>
            <span>Painel completo para gerenciar pedidos</span>
          </div>
          <div className="flex items-center gap-3 text-white/90">
            <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center flex-shrink-0">
              <Check className="w-4 h-4" strokeWidth={2} />
            </div>
            <span>Pagamentos via Pagar.me</span>
          </div>
          <div className="flex items-center gap-3 text-white/90">
            <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center flex-shrink-0">
              <Check className="w-4 h-4" strokeWidth={2} />
            </div>
            <span>Notificacoes em tempo real</span>
          </div>
        </div>
      </div>
    </div>
  );
}
