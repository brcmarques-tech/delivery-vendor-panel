# Delivery Vendor Panel

Painel administrativo (Next.js) para lojistas/vendedores do delivery.

## Pré-requisitos

- Node.js 18+
- [delivery-api](https://gitlab.com/bcm-tech/delivery-api) rodando

## Instalação

```bash
npm install
```

## Variáveis de ambiente

Copie o arquivo de exemplo e configure:

```bash
cp .env.example .env.local
```

## Rodando

```bash
npm run dev   # Desenvolvimento (http://localhost:3000)
npm run build # Build de produção
npm start     # Rodar build de produção
```

## Estrutura

- `src/app/` - Rotas e páginas (App Router)
- `src/app/dashboard/` - Páginas do painel (orders, products, settings)
- `src/components/` - Componentes reutilizáveis
- `src/lib/` - Apollo Client e queries GraphQL
