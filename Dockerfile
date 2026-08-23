FROM node:20-bookworm-slim

RUN apt-get update && apt-get install -y --no-install-recommends \
    exiftool \
    ffmpeg \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

RUN corepack enable && corepack prepare pnpm@9.15.0 --activate

COPY package.json pnpm-workspace.yaml pnpm-lock.yaml* turbo.json tsconfig.base.json ./
COPY metapeek/packages/core/package.json metapeek/packages/core/
COPY metapeek/packages/server/package.json metapeek/packages/server/

RUN pnpm install --frozen-lockfile || pnpm install

COPY metapeek/packages/core metapeek/packages/core/
COPY metapeek/packages/server metapeek/packages/server/

RUN pnpm --filter @metapeek/core build && pnpm --filter @metapeek/server build

ENV PORT=8787
ENV ENABLE_EXIFTOOL=true
ENV MAX_FILE_SIZE=52428800
ENV ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000

EXPOSE 8787

CMD ["node", "metapeek/packages/server/dist/index.js"]
