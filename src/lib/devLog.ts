// KAN-256: log de depuração que só roda fora de produção.
//
// O painel do lojista tinha ~17 `console.log` verbosos ativos em produção
// (`[VENDOR-SUB]`, `[VENDOR-ADVANCE]`, `[VENDOR-REJECT]`...) com orderId,
// orderNumber, status e motivos de rejeição. Não é vulnerabilidade, mas é
// vazamento de informação operacional no console do navegador e polui quem
// precisa depurar de verdade.
//
// `console.error`/`warn` de erros reais podem continuar como estão.
export function devLog(...args: unknown[]): void {
  if (process.env.NODE_ENV !== 'production') {
    console.log(...args);
  }
}
