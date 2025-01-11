FROM oven/bun:1 AS base
WORKDIR /usr/app

COPY . /usr/app
RUN bun install --frozen-lockfile --production


ENV NODE_ENV=production

# run the app
USER bun
ENV PORT=8080
EXPOSE 8080/tcp
ENTRYPOINT [ "bun", "run", "start" ]
