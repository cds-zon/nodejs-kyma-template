# syntax=docker/dockerfile:1

ARG NODE_VERSION=22.16.0
# ARG TARGETPLATFORM=linux/amd64
ARG PORT=3000
FROM node:${NODE_VERSION}-slim AS base
WORKDIR /usr/src/app
EXPOSE $PORT

RUN npm install -g pnpm@latest
RUN pnpm approve-builds esbuild, onnxruntime-node, protobufjs

COPY app/mastra/package.json ./
RUN pnpm i 

COPY app/mastra ./



FROM base AS prod
COPY --from=base /usr/src/app/ /usr/src/app/
WORKDIR /usr/src/app
RUN pnpm build
RUN chown -R node:node /usr/src/app && chmod -R 755 /usr/src/app

USER node
CMD ["node", "--import=./.mastra/output/instrumentation.mjs", ".mastra/output/index.mjs"]



FROM base AS dev
COPY --from=base /usr/src/app/ /usr/src/app/
WORKDIR /usr/src/app
RUN mkdir -p /usr/src/app/store && chown -R node:node /usr/src/app && chmod -R 755 /usr/src/app
USER node
CMD npm run dev
