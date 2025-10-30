# KNOWLEDGE_BASE.md

## Visão Geral
O projeto `nodezao` é uma aplicação full-stack monorepo construída com a stack "Better-T-Stack". Sua função principal é rastrear e monitorar "ofertas" de anúncios, especificamente da Biblioteca de Anúncios do Facebook, através de web scraping automatizado.

O sistema é composto por:
- **Frontend (`apps/web`):** Uma aplicação web em React com TanStack Router para visualização de dados, gerenciamento de ofertas e um dashboard.
- **Backend (`apps/server`):** Um servidor Hono com Node.js que expõe uma API tRPC, gerencia autenticação e executa tarefas agendadas (cron jobs) para o scraping.
- **Bibliotecas Compartilhadas (`packages`):** Módulos para a lógica da API (`api`), autenticação (`auth`) e acesso ao banco de dados (`db`).

## Estrutura do Repositório
A estrutura segue o padrão de um monorepo gerenciado por pnpm e Turborepo.

| Caminho | Descrição | Observações |
| :--- | :--- | :--- |
| `apps/server/` | Aplicação backend (servidor Hono). | Ponto de entrada: `apps/server/src/index.ts`. |
| `apps/web/` | Aplicação frontend (React + Vite). | Ponto de entrada: `apps/web/src/main.tsx`. |
| `packages/api/` | Lógica de negócio e definições da API tRPC. | Ponto de entrada: `packages/api/src/routers/index.ts`. |
| `packages/auth/` | Configuração e lógica de autenticação com `better-auth`. | Ponto de entrada: `packages/auth/src/index.ts`. |
| `packages/db/` | Schema do banco de dados (Drizzle), cliente e seeding. | Ponto de entrada: `packages/db/src/index.ts`. |
| `docs/` | Documentação de referência das tecnologias utilizadas. | Arquivos `.txt` com snippets de documentação. |
| `.claude/` | Configurações para o assistente de IA Claude. | Define permissões para comandos (`Bash`, `WebSearch`, etc.). |

## Stack e Dependências Principais
A stack é baseada no "Better-T-Stack", com as seguintes tecnologias principais:

| Tecnologia | Localização | Função |
| :--- | :--- | :--- |
| **pnpm** | `package.json` (root) | Gerenciador de pacotes e workspaces do monorepo. |
| **Turborepo** | `turbo.json` (root) | Orquestrador de build e tarefas para otimizar o monorepo. |
| **TypeScript** | `tsconfig.base.json` (root) | Linguagem principal, garantindo tipagem em todo o projeto. |
| **React** | `apps/web/package.json` | Biblioteca para construção da interface de usuário. |
| **TanStack Router** | `apps/web/vite.config.ts` | Roteador file-based para a aplicação frontend. As rotas estão em `apps/web/src/routes/`. |
| **Hono** | `apps/server/package.json` | Framework backend leve e performático para Node.js. |
| **tRPC** | `packages/api/package.json` | Criação de APIs com tipagem end-to-end entre backend e frontend. |
| **Drizzle ORM** | `packages/db/package.json` | ORM TypeScript-first para interação com o banco de dados. |
| **PostgreSQL** | `drizzle.config.ts` | Banco de dados relacional utilizado. O driver é `neon`. |
| **TailwindCSS** | `apps/web/index.css` | Framework CSS utility-first para estilização. |
| **shadcn/ui** | `apps/web/components.json` | Coleção de componentes de UI reutilizáveis. |
| **Better-Auth** | `packages/auth/src/index.ts` | Biblioteca para gerenciamento de autenticação (email/senha). |
| **Playwright** | `apps/server/package.json` | Ferramenta para automação de browser, usada no web scraping. |
| **Node-Cron** | `apps/server/package.json` | Biblioteca para agendamento de tarefas (cron jobs). |
| **Vercel AI SDK** | `apps/server/package.json` | Utilizada para a funcionalidade de chat com IA (`/ai`). |

## Arquitetura e Fluxo de Dados
O projeto tem uma arquitetura de monorepo com clara separação de responsabilidades.

1.  **Frontend (`apps/web`):**
    - Renderiza a UI com componentes React e shadcn/ui.
    - Utiliza o TanStack Router para navegação baseada em arquivos (`apps/web/src/routes/`).
    - Comunica-se com o backend exclusivamente via tRPC. O cliente tRPC é configurado em `apps/web/src/utils/trpc.ts` e integra-se com TanStack Query para caching e state management.
    - A autenticação no cliente é gerenciada pelo `better-auth/react` em `apps/web/src/lib/auth-client.ts`.

2.  **Backend (`apps/server`):**
    - O servidor Hono (`apps/server/src/index.ts`) é o ponto de entrada.
    - Expõe três tipos de rotas:
        - `/api/auth/*`: Gerenciadas pelo `better-auth` para login, registro, etc.
        - `/trpc/*`: Roteadas para o `trpcServer`, que executa a lógica de negócio.
        - `/ai`: Endpoint para streaming de respostas de IA (Google Gemini).
    - Executa um cron job (`apps/server/src/jobs/scrape-offers.job.ts`) que periodicamente utiliza o Playwright (`apps/server/src/jobs/facebook-scraper.ts`) para coletar dados da Biblioteca de Anúncios do Facebook.

3.  **Lógica Compartilhada (`packages`):**
    - **`@nodezao/api`**: Define todos os procedimentos tRPC em `packages/api/src/routers/`. O `appRouter` (`packages/api/src/routers/index.ts`) agrega todos os sub-routers (`offer.ts`, `snapshot.ts`, etc.). O contexto tRPC (`packages/api/src/context.ts`) é criado a cada requisição e injeta a sessão do usuário.
    - **`@nodezao/auth`**: Configura a instância do `betterAuth` usando o `drizzleAdapter` para persistir dados de autenticação (`packages/auth/src/index.ts`).
    - **`@nodezao/db`**: Define o schema do banco de dados em `packages/db/src/schema/` e exporta o cliente Drizzle (`db`) em `packages/db/src/index.ts`.

**Fluxo de Dados Principal (Consulta de Ofertas):**
1. O usuário acessa a página `/offers` no frontend (`apps/web/src/routes/offers/index.tsx`).
2. O componente React chama o hook `trpc.offer.getAll.useQuery()`.
3. O cliente tRPC envia uma requisição HTTP para `http://localhost:3000/trpc/offer.getAll`.
4. O servidor Hono (`apps/server/src/index.ts`) recebe a requisição e a repassa para o middleware do tRPC.
5. O `appRouter` (`packages/api/src/routers/index.ts`) direciona a chamada para o `offerRouter` (`packages/api/src/routers/offer.ts`).
6. O procedimento `getAll` é executado, utilizando o cliente Drizzle (`db`) para consultar a tabela `offers` no banco de dados.
7. O resultado é serializado e retornado ao frontend, com tipos preservados.
8. O TanStack Query gerencia o estado dos dados na UI.

## Convenções de Código
- **Nomenclatura de Arquivos:** Componentes React usam `.tsx`. Lógica e configurações usam `.ts`. Arquivos de rota do TanStack Router são nomeados conforme o caminho da URL (ex: `offers/$offerId.tsx`). Tarefas agendadas possuem o sufixo `.job.ts`.
- **Organização de Pastas:**
    - `apps/web/src/routes/`: Estrutura de rotas file-based.
    - `apps/web/src/components/ui/`: Componentes `shadcn/ui`.
    - `packages/api/src/routers/`: Módulos da API tRPC por domínio.
    - `packages/api/src/validators/`: Schemas de validação Zod para os inputs da API.
    - `packages/db/src/schema/`: Definições de tabelas do Drizzle, uma por arquivo.
- **Tipagem:** TypeScript é usado de forma estrita (`"strict": true` em `tsconfig.base.json`). A tipagem end-to-end é um pilar da arquitetura, fluindo do schema Drizzle -> API tRPC -> Frontend React.
- **Estilo de Código:** O código é consistente, mas não há um formatador (Prettier, Biome) configurado no `package.json`. A indentação e o estilo seguem convenções modernas de TypeScript/React.
- **Importações:** São usados aliases de caminho (`@/*`) tanto no frontend (`apps/web/tsconfig.json`) quanto no backend (`apps/server/tsconfig.json`).

## Design System / UI
- **Biblioteca de Componentes:** O projeto utiliza `shadcn/ui`, conforme configurado em `apps/web/components.json`. Os componentes base (primitivos) são do Radix UI.
- **Estilização:** TailwindCSS é a principal ferramenta de estilização. As configurações e variáveis de tema estão em `apps/web/index.css`.
- **Theming:** O tema (claro/escuro) é gerenciado pelo `ThemeProvider` (`apps/web/src/components/theme-provider.tsx`), que utiliza `next-themes`. As cores são definidas em `oklch` como variáveis CSS na raiz do documento (`:root` e `.dark`).
- **Componentes Principais:** A pasta `apps/web/src/components/ui/` contém componentes como `Button`, `Card`, `Input`, `Table`, `Dialog`, `Badge`, `Select` e `Tabs`. Eles são adicionados e gerenciados via `shadcn/ui` CLI.
- **Layout:** A estrutura de layout principal é definida em `apps/web/src/routes/__root.tsx`, utilizando um grid CSS para separar o `Header` do conteúdo (`Outlet`).

## APIs e Backend
O backend expõe endpoints via Hono, principalmente para servir a API tRPC.

**API tRPC (`/trpc/*`):**
- **Router Principal:** `packages/api/src/routers/index.ts`
- **Sub-Routers:**
    - **`offerRouter` (`packages/api/src/routers/offer.ts`):**
        - `getAll`: (protegido) Retorna todas as ofertas do usuário com filtros.
        - `getById`: (protegido) Retorna uma oferta específica com seus snapshots.
        - `create`, `update`, `delete`: (protegido) Operações CRUD para ofertas.
        - `getStats`: (protegido) Retorna estatísticas sobre as ofertas do usuário.
    - **`snapshotRouter` (`packages/api/src/routers/snapshot.ts`):**
        - `getByOfferId`: (protegido) Retorna snapshots de uma oferta.
        - `getLatest`: (protegido) Retorna o snapshot mais recente de cada oferta do usuário.
        - `getDelta`: (protegido) Calcula a variação de criativos nas últimas 24h.
        - `create`: (público) Cria um snapshot manualmente.
    - **`configRouter` (`packages/api/src/routers/config.ts`):**
        - Gerencia configurações como `regions`, `offerTypes`, `niches`, `tags` e `badges` com operações CRUD.
    - **`todoRouter` (`packages/api/src/routers/todo.ts`):**
        - Exemplo de CRUD para uma lista de tarefas.

**Outros Endpoints:**
- **`/api/auth/*`:** Gerenciado por `better-auth` para autenticação.
- **`/ai`:** (`POST`) Recebe mensagens e faz streaming de uma resposta do Google Gemini.

**Banco de Dados (Drizzle Schema em `packages/db/src/schema/`):**
- `offers`: Tabela principal, armazena informações sobre as ofertas monitoradas. Relaciona-se com `user`.
- `creative_snapshots`: Armazena o número de criativos de uma oferta em um determinado momento. Relaciona-se com `offers`.
- `user`, `session`, `account`: Tabelas para o sistema de autenticação `better-auth`.
- `regions`, `offer_types`, `niches`, `tags`, `badges`: Tabelas de configuração para categorizar as ofertas.
- `todo`: Tabela de exemplo.

## Infra e Deploy
- **Build:** Turborepo (`turbo.json`) orquestra os builds. `tsdown` é usado para transpilar os pacotes (`packages/*`) e o servidor (`apps/server`). `vite` é usado para buildar o frontend (`apps/web`).
- **Scripts:**
    - `pnpm dev`: Inicia o servidor e o cliente em modo de desenvolvimento.
    - `pnpm build`: Constrói todas as aplicações e pacotes para produção.
    - `pnpm db:push`: Aplica as mudanças do schema Drizzle ao banco de dados (desenvolvimento).
    - `pnpm db:studio`: Abre o Drizzle Studio para visualizar o banco de dados.
    - `pnpm db:generate`: Gera arquivos de migração (produção).
    - `pnpm db:seed`: Popula o banco de dados com dados iniciais (`packages/db/src/seed.ts`).
- **Variáveis de Ambiente (`apps/server/.env`):**
    - `DATABASE_URL`
    - `BETTER_AUTH_SECRET`
    - `BETTER_AUTH_URL`
    - `CORS_ORIGIN`
    - `GOOGLE_GENERATIVE_AI_API_KEY`
- **Variáveis de Ambiente (`apps/web/.env`):**
    - `VITE_SERVER_URL`
- **Deploy:** Não há configurações de deploy prontas (`bts.jsonc`). Para produção, seria necessário usar `pnpm build` e `pnpm db:migrate`.

## Testes
O `AGENTS.md` (arquivo `AGENTS.md`) afirma explicitamente: "This codebase currently includes example implementations (todo, ai) but no test infrastructure." Não há arquivos de teste, configurações de framework de teste (Vitest, Jest) ou scripts de teste nos `package.json`.

## Operação e Desenvolvimento
**Para iniciar o ambiente de desenvolvimento:**
1.  Garanta que um banco de dados PostgreSQL esteja acessível.
2.  Crie o arquivo `.env` em `apps/server/` com as variáveis de ambiente necessárias.
3.  Execute `pnpm install` na raiz do projeto.
4.  Execute `pnpm db:push` para sincronizar o schema com o banco de dados.
5.  (Opcional) Execute `pnpm db:seed` para popular as tabelas de configuração.
6.  Execute `pnpm dev` para iniciar o frontend (porta 3001) e o backend (porta 3000).

**Para adicionar uma nova feature (ex: nova entidade "Campanha"):**
1.  Criar o schema Drizzle em `packages/db/src/schema/campaign.ts`.
2.  Adicionar o schema ao `index.ts` da pasta se necessário.
3.  Executar `pnpm db:push`.
4.  Criar validadores Zod em `packages/api/src/validators/campaign.ts`.
5.  Criar o tRPC router em `packages/api/src/routers/campaign.ts`.
6.  Adicionar o `campaignRouter` ao `appRouter` em `packages/api/src/routers/index.ts`.
7.  Criar as rotas e componentes no frontend (`apps/web/src/routes/campaigns/`) para interagir com os novos endpoints tRPC.

## Padrões a Seguir (para IAs e Devs)
1.  **Código e Design:** Siga estritamente os padrões existentes. Utilize componentes `shadcn/ui` e classes Tailwind. Não introduza novas bibliotecas de UI ou metodologias de estilo.
2.  **Estrutura:** Mantenha a organização de pastas `apps` e `packages`. Novas lógicas de negócio devem ser adicionadas como novos routers tRPC em `packages/api`.
3.  **Componentes:** Crie novos componentes React em `apps/web/src/components/`, seguindo o padrão de arquivos `.tsx` com exportações nomeadas.
4.  **APIs:** Novos endpoints devem ser implementados como procedimentos tRPC. A lógica deve ser encapsulada nos routers em `packages/api`, com validação de entrada via Zod em `packages/api/src/validators`.
5.  **Banco de Dados:** Modificações no schema devem ser feitas nos arquivos de `packages/db/src/schema/` e aplicadas com `pnpm db:push` (dev) ou `pnpm db:generate` (prod).
6.  **Tipagem:** Mantenha a tipagem estrita e completa em todo o código.
7.  **Dependências:** Adicione novas dependências apenas com justificativa clara e no workspace apropriado (`apps/*` ou `packages/*`). Execute `pnpm install` a partir da raiz.

## Dívida Técnica e Pontos de Atenção
1.  **Ausência de Testes:** O projeto não possui qualquer infraestrutura de testes (unitários, integração ou e2e), o que é um risco significativo para a manutenção e evolução.
2.  **Web Scraper Frágil:** O scraper em `apps/server/src/jobs/facebook-scraper.ts` depende de seletores de CSS da página da Biblioteca de Anúncios do Facebook. Qualquer mudança no layout do site pode quebrar a funcionalidade. O código usa múltiplos seletores como fallback, indicando uma tentativa de mitigar essa fragilidade, mas o risco permanece.
3.  **Segurança de Cron Job:** O endpoint `snapshot.create` é público, o que pode ser um vetor de abuso se não for devidamente protegido em produção.
4.  **Tratamento de Erros:** O tratamento de erros no scraper (`facebook-scraper.ts`) é básico, usando `console.warn`. Em produção, um sistema de logging e alertas mais robusto seria necessário.

## FAQ e Dicas Práticas
- **Como rodar apenas o frontend ou backend?**
  - `pnpm dev:web` para o frontend.
  - `pnpm dev:server` para o backend.
- **Por que minhas alterações não estão sendo refletidas após o build?**
  - O Turborepo faz cache dos builds. Use `turbo build --force` para forçar a reconstrução de todos os pacotes.
- **Onde configuro as variáveis de ambiente?**
  - O backend usa `apps/server/.env`. O frontend usa `apps/web/.env`.
- **Como vejo os dados do meu banco de dados?**
  - Execute `pnpm db:studio`.

## Sumário Técnico
| Categoria | Detalhes |
| :--- | :--- |
| **Monorepo** | pnpm workspaces, Turborepo |
| **Linguagem** | TypeScript |
| **Frontend Framework** | React 19, Vite |
| **Roteamento Frontend** | TanStack Router (file-based) |
| **Backend Framework** | Hono (com Node.js) |
| **API** | tRPC |
| **Banco de Dados** | PostgreSQL (via Neon serverless driver) |
| **ORM** | Drizzle ORM |
| **Autenticação** | Better-Auth |
| **Build Tool** | Turborepo, Vite, tsdown |
| **Design System** | shadcn/ui, Radix UI, TailwindCSS |
| **Test Framework** | Nenhum |
| **Automação/Scraping** | Playwright, Node-Cron |

## Conclusão
`nodezao` é uma aplicação robusta e moderna para rastreamento de anúncios, construída sobre uma stack TypeScript end-to-end que prioriza a tipagem segura e a produtividade do desenvolvedor. A arquitetura de monorepo com separação clara entre frontend, backend e pacotes compartilhados, combinada com tRPC e Drizzle, cria um fluxo de dados coeso e de fácil manutenção. O principal desafio do projeto é a fragilidade inerente ao web scraping e a completa ausência de uma suíte de testes automatizados. Qualquer desenvolvedor ou IA que trabalhe neste projeto deve focar em manter a consistência arquitetônica e seguir os padrões estabelecidos para garantir a escalabilidade e a manutenibilidade do código.