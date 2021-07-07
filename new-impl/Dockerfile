FROM ubuntu:20.10
ARG UID=1000
ARG GID=100
RUN apt-get update
RUN apt-get install -y wget unzip
RUN apt-get -y install nodejs
RUN apt-get -y install npm
RUN npm install npm@latest -g
RUN wget https://github.com/joewalnes/websocketd/releases/download/v0.4.1/websocketd-0.4.1-linux_amd64.zip
RUN unzip websocketd*
RUN mv websocketd /bin/
RUN apt-get -y install jq curl
RUN mkdir -p /app
RUN groupadd -g $GID app  || true
RUN useradd -ms /bin/bash -u $UID -g $GID app
RUN mkdir -p /app

WORKDIR /app
COPY package.json /app/
COPY package-lock.json /app/
RUN ls -la
RUN npm install
COPY src /app/src
COPY babel.config.js /app/
COPY webpack.config.js /app/

ENV PATH=/app/node_modules/.bin:$PATH
RUN webpack

COPY tsconfig.json /app/

RUN chown -R $UID /app
RUN chgrp -R $GID /app
USER app
