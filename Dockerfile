FROM node:16
ARG UID=1000
ARG GID=100
RUN echo version 1
RUN apt-get update
RUN apt-get install -y wget unzip
RUN npm install npm@latest -g
RUN wget https://github.com/joewalnes/websocketd/releases/download/v0.4.1/websocketd-0.4.1-linux_amd64.zip
RUN unzip websocketd*
RUN mv websocketd /bin/

RUN groupadd -g $GID app  || true
RUN useradd -ms /bin/bash -u $UID -g $GID app

RUN mkdir -p /app
RUN chgrp $GID /app
RUN chown $UID /app

USER app
WORKDIR /app
COPY --chown=app:100 package.json /app/
COPY --chown=app:100 package-lock.json /app/
RUN ls -la
RUN npm install
COPY --chown=app:100 src /app/src
COPY --chown=app:100 babel.config.js /app/
COPY --chown=app:100 webpack.config.js /app/

ENV PATH=/app/node_modules/.bin:$PATH
ENV BABEL_DISABLE_CACHE=1
ENV NODE_ENV=production
RUN webpack

COPY --chown=app:100 tsconfig.json /app/

COPY --chown=app:100 cgi /app/cgi
COPY --chown=app:100 server.sh /app/
