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
VITE_TMDB_ACCESS_TOKEN="seu_read_access_token_da_tmdb"
VITE_TMDB_API_BASE_URL="https://api.themoviedb.org/3"
VITE_TMDB_IMAGE_BASE_URL="https://image.tmdb.org/t/p"
```

Observacao: como este projeto usa Vite, variaveis `VITE_*` sao aplicadas em
tempo de build. Se trocar alguma delas em producao, gere um novo build.

## Rodando em desenvolvimento

Suba o servidor local:

```bash
npm run dev
```

Por padrao, o Vite abre em:

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
- Nginx serve os arquivos estaticos de `dist`;
- a aplicacao fica exposta na porta `80` dentro do container.

Monte a imagem passando o token da TMDB como build arg:

```bash
docker build \
  -t movies-catalog:local \
  --build-arg VITE_TMDB_ACCESS_TOKEN="seu_read_access_token_da_tmdb" \
  --build-arg VITE_TMDB_API_BASE_URL="https://api.themoviedb.org/3" \
  --build-arg VITE_TMDB_IMAGE_BASE_URL="https://image.tmdb.org/t/p" \
  .
```

No PowerShell:

```powershell
docker build `
  -t movies-catalog:local `
  --build-arg VITE_TMDB_ACCESS_TOKEN="seu_read_access_token_da_tmdb" `
  --build-arg VITE_TMDB_API_BASE_URL="https://api.themoviedb.org/3" `
  --build-arg VITE_TMDB_IMAGE_BASE_URL="https://image.tmdb.org/t/p" `
  .
```

Rode o container:

```bash
docker run --rm -p 8080:80 movies-catalog:local
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

## Estrutura principal

```text
src/
  app/                 # rotas da aplicacao
  components/          # componentes compartilhados
  config/              # env e query client
  contexts/            # tema e i18n
  features/            # features de catalogo e detalhes
  hooks/               # hooks compartilhados
  lib/tmdb/            # cliente, endpoints e imagens da TMDB
  types/               # tipos TypeScript
  utils/               # formatadores e helpers
```
