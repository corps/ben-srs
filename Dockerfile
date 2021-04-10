FROM node

ENV PATH=$PATH:/app/node_modules/.bin
ENV BABEL_DISABLE_CACHE=1

RUN apt-get update
RUN apt-get install -y youtube-dl ffmpeg
WORKDIR /app

COPY package.json /app/
COPY package-lock.json /app/
COPY tsconfig.json /app/
RUN npm install
COPY src /app/src

RUN bash -c 'tsc || true'

ENTRYPOINT node ./src/server/index.js
