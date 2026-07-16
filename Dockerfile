FROM node:22-alpine AS build

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

# O token da TMDB NÃO entra no build: ele é injetado em runtime pelo nginx.
# Só as bases públicas são embutidas no bundle.
ARG VITE_TMDB_API_BASE_URL=/api/tmdb
ARG VITE_TMDB_IMAGE_BASE_URL=https://image.tmdb.org/t/p

ENV VITE_TMDB_API_BASE_URL=$VITE_TMDB_API_BASE_URL
ENV VITE_TMDB_IMAGE_BASE_URL=$VITE_TMDB_IMAGE_BASE_URL

RUN npm run build

FROM nginx:1.27-alpine AS production

# Como template: o entrypoint da imagem roda envsubst e materializa
# /etc/nginx/conf.d/default.conf com o TMDB_ACCESS_TOKEN do ambiente.
COPY nginx.conf /etc/nginx/templates/default.conf.template
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://127.0.0.1/ >/dev/null || exit 1

CMD ["nginx", "-g", "daemon off;"]
