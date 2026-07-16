# Movies Catalog

Catalogo de filmes e series feito com React, Vite, TypeScript, React Query,
Material UI, Tailwind CSS e API da TMDB.

O app consome dados da TMDB, mostra home com carrosseis, catalogo paginado,
pagina de detalhes, elenco, trailer embutido, classificacao indicativa,
alternancia de idioma e tema.

## Tecnologias principais

- React 19: interface e componentes.
- Vite 6: servidor de desenvolvimento e build.
- TypeScript: tipagem da aplicacao.
- React Router 7: rotas da SPA.
- TanStack React Query 5: cache, prefetch e sincronizacao das queries.
- Axios: cliente HTTP para a API da TMDB.
- Material UI 6: componentes e icones.
- Tailwind CSS 3: utilitarios de estilo e layout.
- Vitest + Testing Library: testes automatizados.
- Nginx: servidor estatico usado na imagem Docker.
- Docker: build e execucao em container.

## Requisitos

- Node.js 22 ou superior
- npm
- Token de leitura da TMDB
- Docker, apenas se for rodar via container

## Instalacao

Clone o repositorio:

```bash
git clone https://github.com/gesser0102/movies-catalog.git
cd movies-catalog
```

Instale as dependencias:

```bash
npm install
```

## Variaveis de ambiente

Copie o arquivo de exemplo:

```bash
cp .env.example .env.local
```

No Windows PowerShell:

```powershell
Copy-Item .env.example .env.local
```

Preencha:

```env
TMDB_ACCESS_TOKEN="seu_read_access_token_da_tmdb"
VITE_TMDB_API_BASE_URL="/api/tmdb"
VITE_TMDB_IMAGE_BASE_URL="https://image.tmdb.org/t/p"
```

Observacoes:

- `TMDB_ACCESS_TOKEN` nao tem o prefixo `VITE_` de proposito: o token nunca
  entra no bundle do navegador. Quem o injeta e o proxy sera o dev server do
  Vite em desenvolvimento e o nginx em producao (`location /api/tmdb/`).
- Variaveis `VITE_*` sao aplicadas em tempo de build. Se trocar alguma delas
  em producao, gere um novo build. O token, por ser de runtime, pode ser
  trocado apenas reiniciando o container.

## Rodando em desenvolvimento

Suba o servidor local:

```bash
npm run dev
```

Acesse o servidor local em:

```text
http://localhost:5173
```

## Build local

Para gerar o build de producao:

```bash
npm run build
```

Para testar o build gerado:

```bash
npm run preview
```

## Rodando com Docker

O Dockerfile usa build multi-stage:

- Node faz o build do Vite;
- Nginx serve os arquivos estaticos de `dist` e faz proxy da TMDB
  (`/api/tmdb/`), injetando o token no servidor e cacheando respostas na
  borda por 5 minutos;
- a aplicacao fica exposta na porta `80` dentro do container.

Monte a imagem (sem token — ele nao participa do build):

```bash
docker build -t movies-catalog:local .
```

Rode o container passando o token como variavel de runtime:

```bash
docker run --rm -p 8080:80 \
  -e TMDB_ACCESS_TOKEN="seu_read_access_token_da_tmdb" \
  movies-catalog:local
```

No PowerShell:

```powershell
docker run --rm -p 8080:80 `
  -e TMDB_ACCESS_TOKEN="seu_read_access_token_da_tmdb" `
  movies-catalog:local
```

Depois acesse:

```text
http://localhost:8080
```

## Scripts disponiveis

```bash
npm run dev            # servidor de desenvolvimento
npm run build          # typecheck + build de producao
npm run preview        # preview local do build
npm run typecheck      # valida TypeScript
npm run test           # roda a suite de testes
npm run test:coverage  # roda testes com coverage
```

## Estrutura do projeto

```text
.
  docs/                       # documentacao por tema (arquitetura, cache, deploy...)
  nginx.conf                  # servidor estatico da imagem Docker
  Dockerfile                  # build multi-stage (Node -> Nginx)
  src/                        # codigo da aplicacao
```

### src/

```text
src/
  app/
    providers/                # AppProviders: React Query, tema, i18n e
                              # ciclo de vida da persistencia do cache
    router/                   # rotas da SPA + preload de chunks de rota

  components/                 # componentes compartilhados entre features
    feedback/                 # ErrorState, EmptyState, LoadingState,
                              # ErrorBoundary, NotFoundPage
    layout/                   # Header e RootLayout
    media/                    # MediaCard (prefetch por hover/viewport),
                              # MediaSlider, HoverPreviewCard, badges

  config/                     # configuracao central
    env.ts                    # variaveis de ambiente tipadas
    queryClient.ts            # instancia do React Query + TTLs por familia
    queryKeys.ts              # query keys centralizadas (modulo puro)
    queryCachePersistence.ts  # persistencia seletiva do cache em localStorage
                              # (debounce com teto + prune por idade)

  contexts/
    i18n/                     # provider de idioma + dicionarios pt-BR/en-US
                              # (inclui a regra de idioma alternativo)
    theme/                    # modo claro/escuro
    scroll/                   # restauracao de scroll entre rotas

  features/                   # cada feature agrupa api, paginas e componentes
    catalog/
      api/                    # hooks de listas (trending, discover...) e
                              # aquecimento do idioma alternativo da home
      components/             # Hero e componentes da home
      pages/                  # HomePage e CatalogPage (paginacao/filtros)
    details/
      api/                    # hooks de creditos, similares e episodios
                              # por temporada
      components/             # CastSlider, TrailerModal, SeasonEpisodes
                              # (seletor de temporada + acordeao de episodios)
      pages/                  # DetailsPage

  hooks/                      # hooks compartilhados entre features:
                              # useMediaDetails (initialData via smart cache)
                              # e mediaDetailsSmartCache (split base/texto)

  lib/tmdb/                   # camada de acesso a TMDB (sem React)
    client.ts                 # axios + tratamento de erro de dominio
    httpCache.ts              # dedupe de requests em voo + micro-cache por URL
    endpoints.ts              # barrel dos endpoints
    lists.ts                  # listas com base pt-BR + overlay de traducao
    details.ts                # detalhes com URL canonica por idioma,
                              # trailer e dados regionais (BR)
    seasons.ts                # episodios por temporada
    credits.ts / genres.ts    # creditos e generos
    regional.ts               # datas/classificacao por regiao
    normalizers.ts            # shape cru da TMDB -> MediaItem da UI
    images.ts                 # URLs de poster/backdrop
    constants.ts / types.ts   # idioma-base, regiao e tipos da camada

  test/                       # setup de testes (Vitest + Testing Library)
  theme/                      # tema do Material UI
  types/                      # tipos TypeScript espelhando a TMDB
  utils/                      # formatadores (datas, duracao)
```

Convencao de dependencias: `features/` consome `hooks/`, `components/`,
`config/` e `lib/`; `lib/tmdb` nao conhece React nem React Query; paginas nao
conhecem query keys nem idioma (isso fica nos hooks de `api/`). Os testes
ficam ao lado do arquivo testado (`*.test.ts[x]`).

