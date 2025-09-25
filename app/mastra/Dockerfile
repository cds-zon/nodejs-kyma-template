FROM node:22.16.0-slim AS base
ARG NODE_VERSION=22.16.0

ARG PORT=4111
ARG TARGETPLATFORM=linux/amd64
EXPOSE $PORT
WORKDIR /usr/src/app

RUN npm install -g pnpm@latest
RUN pnpm approve-builds esbuild, onnxruntime-node, protobufjs

COPY app/mastra/package.json ./
RUN pnpm i 

COPY app/mastra ./



FROM base AS prod
COPY --from=base /usr/src/app/ /usr/src/app/
WORKDIR /usr/src/app
RUN pnpm build
RUN mkdir -p /usr/src/app/db && chown -R node:node /usr/src/app && chmod -R 755 /usr/src/app

USER node
CMD ["node", "--import=./.mastra/output/instrumentation.mjs", ".mastra/output/index.mjs"]



FROM base AS dev
COPY --from=base /usr/src/app/ /usr/src/app/
WORKDIR /usr/src/app
RUN mkdir -p /usr/src/app/db  && chmod -R 755 /usr/src/app && chown -R node:node /usr/src/app
USER node
CMD pnpm dev
