## Checklist automatizada — alterações propostas

Este arquivo lista alterações propostas, por que fazê-las e comandos/checagens recomendadas. Não aplica mudanças automaticamente — é uma lista para revisão e execução manual.

### Instruções
- Revise cada item e marque como concluído ao aplicar a mudança.
- Para checagens automáticas sugeridas, rode os comandos informados na seção `Comandos rápidos`.

---

### 1) Garantir `NEXT_PUBLIC_API_URL` configurado em produção
- Por que: `src/lib/apollo.ts` faz fallback para `https://api.bcmtech.com.br/graphql` em produção, mas é importante validar a variável no deploy.
- Ação proposta: adicionar validação no pipeline/README e no deploy para garantir `NEXT_PUBLIC_API_URL` esteja presente.
- Arquivos relacionados: [next.config.ts](next.config.ts), [src/lib/apollo.ts](src/lib/apollo.ts)

### 2) Documentar e padronizar porta de desenvolvimento
- Por que: `package.json` usa `dev` com `--port 3001` para evitar conflito com API.
- Ação proposta: atualizar README com passo `yarn dev --port 3001` e instruções de ambiente.
- Arquivos relacionados: [package.json](package.json), [README.md](README.md)

### 3) Renomeação de terminologia: "disputa" → "reclamação"
- Por que: regra de projeto indicada em `CLAUDE.md`/project rules.
- Ação proposta: buscar ocorrências e aplicar alteração onde pertinente (UI copy). Fazer revisão de traduções e testes manuais.
- ATENCAO (2026-08-22): trocar SOMENTE a copy visivel em PT-BR (labels/textos). NAO renomear o enum `OrderStatus.DISPUTED`, os campos GraphQL `dispute*`/`disputedOrders`/`resolveDispute` nem nomes de arquivo — sao contrato da API e quebram app/paineis. Sao ~186 ocorrencias em 19 arquivos, a maioria e schema/enum, nao copy.

### 4) Verificações de segurança e sessões
- Por que: `SESSION_KICKED` subscription e tratamento de sessão são críticos; validar flows de `SESSION_EXPIRED` e `UNAUTHENTICATED`.
- Ação proposta: revisar `src/lib/apollo.ts` e fluxos de logout, adicionar testes manuais de sessão concorrente.

### 5) UI / UX: confirm dark mode and layout rules
- Por que: projeto exige dark mode e layout `h-screen overflow-hidden` para dashboard.
- Ação proposta: revisar `src/app/layout.tsx`, `src/app/dashboard/layout.tsx` e `globals.css` para assegurar variáveis CSS e comportamento.

### 6) GraphQL codegen / typings
- Por que: já existe `src/lib/__generated__/graphql.ts` — manter atualizado.
- Ação proposta: rodar `yarn generate` após alterações no schema e documentar no README o comando de geração.

### 7) Tests & CI (proposta)
- Por que: não há testes detectados; adicionar lint + build step no CI ao menos.
- Ação proposta: criar pipeline com `yarn lint` e `yarn build` e, opcionalmente, testes unitários com Vitest/Jest.

---

## Comandos rápidos
- Rodar lint: `yarn lint`
- Gerar GraphQL: `yarn generate`
- Rodar dev local: `yarn dev --port 3001`

---

Se quiser, eu posso transformar esta lista em um checklist executável (script que marca itens como concluídos), ou gerar PRs individuais para cada alteração proposta. Diga como prefere prosseguir.
