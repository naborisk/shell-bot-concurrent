FROM oven/bun
WORKDIR /srv/app
COPY . .
RUN bun install
ENTRYPOINT [ "bun", "run", "src/index.ts" ]
