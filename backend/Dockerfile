FROM oven/bun:1-alpine AS base
WORKDIR /usr/app

RUN apk add g++ make py3-pip

COPY . /usr/app
RUN bun install --frozen-lockfile --production


ENV NODE_ENV=production

# run the app
USER bun
ENV PORT=8080
EXPOSE 8080/tcp
ENTRYPOINT [ "bun", "run", "start" ]
