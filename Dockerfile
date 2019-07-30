FROM node:12-alpine AS node-builder
WORKDIR /build

COPY package.json tsconfig.json ./
RUN npm i

COPY source source
RUN node_modules/.bin/tsc

RUN rm -rf node_modules && npm ci --production


FROM resilio/sync AS rslsync


FROM node:12-buster
WORKDIR /app
VOLUME /folders

ENV NODE_ENV=production

COPY --from=rslsync /usr/bin/rslsync /usr/bin/rslsync
COPY --from=node-builder /build/node_modules ./node_modules
COPY --from=node-builder /build/dist ./

CMD [ "/usr/local/bin/node", "index.js", "--basedir", "/folders", "--keyfile", "/run/secrets/resilio-share.txt" ]
