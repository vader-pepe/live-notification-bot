# base
FROM node:22.13.1-slim AS base

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm i -g husky

RUN npm install --omit=dev

COPY . .

# for lint

FROM base AS linter

WORKDIR /usr/src/app

RUN npm i -g biome

RUN npm run lint

# for build

FROM linter AS builder

WORKDIR /usr/src/app

RUN npm i -g tsup

RUN npm i -g typescript

RUN npm run build

# for production

FROM node:22-alpine

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm i -g husky

RUN npm install --omit=dev

COPY --from=builder /usr/src/app/dist ./

EXPOSE 3000

CMD ["node","index.js"]
