FROM node:8-alpine
ENV NODE_ENV production
ARG version=1.0.0
WORKDIR /usr/src/steem-signservice
COPY . .
RUN npm version ${version}
RUN npm install typescript -g
RUN npm install --production --silent
RUN tsc
EXPOSE 5000
CMD node ./build/server.js