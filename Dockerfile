FROM oven/bun
WORKDIR /srv/app
COPY ./package.json .
COPY ./modules/*.ts ./modules/
COPY ./index.ts .
RUN bun install
ENTRYPOINT [ "bun", "run", "index.ts" ]
