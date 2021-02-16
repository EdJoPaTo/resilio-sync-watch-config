FROM docker.io/library/node:14-buster AS node-builder
WORKDIR /build

COPY package.json tsconfig.json ./
RUN npm i

COPY source source
RUN node_modules/.bin/tsc

RUN rm -rf node_modules && npm ci --production


FROM docker.io/resilio/sync AS rslsync


FROM docker.io/library/node:14-buster
WORKDIR /app
VOLUME /folders

ENV NODE_ENV=production

COPY --from=rslsync /usr/bin/rslsync /usr/bin/rslsync
COPY --from=node-builder /build/node_modules ./node_modules
COPY --from=node-builder /build/dist ./

CMD node --unhandled-rejections=strict -r source-map-support/register index.js --basedir /folders --keyfile /run/secrets/resilio-share.txt
