# Arquitetura geral

## Objetivo da arquitetura

A aplicacao foi organizada para separar responsabilidades:

- UI e interacao ficam em componentes React.
- Dados remotos ficam encapsulados em hooks de query.
- Requests e normalizacao da TMDB ficam em `src/lib/tmdb`.
- Estado global real fica limitado a tema, idioma e cache do React Query.
- Tipos compartilhados ficam em `src/types`.

Essa separacao facilita explicar o projeto como uma aplicacao frontend moderna,
com fronteiras claras entre apresentacao, dominio e infraestrutura.

## Estrutura principal

```text
src/
  app/
    providers/       # providers globais
    router/          # definicao de rotas e preloads
  components/
    feedback/        # erro, loading, empty, boundary, not found
    layout/          # header e root layout
    media/           # cards, sliders, badges e hover preview
  config/
    env.ts           # acesso centralizado a variaveis Vite
    queryClient.ts   # React Query client, keys e staleTime
  contexts/
    i18n/            # idioma e dicionarios
    theme/           # light/dark mode
  features/
    catalog/         # home, catalogo e queries de listagem
    details/         # pagina de detalhes, credits, trailer e queries
  hooks/
    useMediaDetails.ts
    mediaDetailsSmartCache.ts
  lib/
    tmdb/            # axios client, endpoints e imagens
  theme/
    createAppTheme.ts
  types/
    tmdb.ts
  utils/
    format.ts
```

## Fluxo de bootstrap

Entrada:

```text
main.tsx
  -> App.tsx
    -> AppProviders
      -> QueryClientProvider
      -> ColorModeProvider
      -> I18nProvider
      -> RouterProvider
```

Arquivos envolvidos:

- `src/main.tsx`
- `src/App.tsx`
- `src/app/providers/AppProviders.tsx`
- `src/app/router/router.tsx`

`AppProviders` e o ponto onde a aplicacao ganha contexto global:

- `QueryClientProvider`: cache e estado de servidor.
- `ColorModeProvider`: tema claro/escuro.
- `I18nProvider`: idioma e textos da UI.
- `ReactQueryDevtools`: habilitado apenas em desenvolvimento.

## Por que nao Redux/Zustand

A aplicacao nao tem muito estado client-side complexo. O que existe e:

- estado remoto da TMDB;
- idioma;
- tema;
- estados locais de UI, como modal aberto, indice do hero e drawer.

O estado remoto e melhor representado por React Query, porque ele resolve:

- cache;
- deduplicacao;
- stale time;
- retry;
- prefetch;
- placeholder data;
- sincronizacao com loading/error.

Redux ou Zustand adicionariam uma camada extra sem resolver melhor o problema
principal, que e cache de dados remotos.

## Padrao por feature

O projeto separa `catalog` e `details`.

`features/catalog` cuida de:

- Home de filmes/series.
- Hero.
- Carrosseis.
- Pagina geral de catalogo.
- Queries de listagem, generos, trending, discover e collections.

`features/details` cuida de:

- Pagina de detalhes.
- Elenco principal.
- Modal de creditos completos.
- Modal de trailer.
- Queries de creditos e similares.

Essa divisao deixa claro que componentes compartilhados, como `MediaCard` e
`MediaSlider`, nao pertencem a uma feature especifica.

## Camadas de dados

O caminho de dados normalmente e:

```text
Componente
  -> hook de query da feature
    -> endpoint em lib/tmdb/endpoints.ts
      -> tmdbClient em lib/tmdb/client.ts
        -> API da TMDB
```

Exemplo:

```text
HomePage
  -> useTrending
    -> getTrending
      -> fetchMediaList
        -> tmdbClient.get
```

Essa arquitetura permite trocar detalhes da API ou da normalizacao sem espalhar
mudancas pela UI.

## Decisoes importantes

- TypeScript define contratos para respostas da TMDB e dados normalizados.
- React Query centraliza cache e status de request.
- A TMDB e acessada apenas pela camada `lib/tmdb`.
- UI nao conhece detalhes como `release_date`, `first_air_date`, `poster_path`.
  Ela consome objetos normalizados ou detalhes tipados.
- O app usa uma SPA com Nginx em producao, por isso `nginx.conf` tem fallback
  para `index.html`.

## Como explicar na entrevista

Uma boa resposta:

> Eu organizei a aplicacao por feature, mantendo a integracao com a TMDB em uma
> camada propria. Os componentes nao chamam Axios diretamente; eles usam hooks de
> query. Isso me permitiu centralizar cache, regionalidade, normalizacao,
> tratamento de erro e prefetch sem acoplar a UI aos detalhes da API.
