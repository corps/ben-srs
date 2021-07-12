FROM ubuntu:20.10
ARG UID=1000
ARG GID=100
RUN echo version 1
RUN apt-get update
RUN apt-get install -y wget unzip nodejs npm jq curl
RUN apt-get install -y python pip
RUN pip install --upgrade youtube-dl
RUN apt-get install -y ffmpeg

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
COPY --chown=$UID:$GID package.json /app/
COPY --chown=$UID:$GID package-lock.json /app/
RUN ls -la
RUN npm install
COPY --chown=$UID:$GID src /app/src
COPY --chown=$UID:$GID babel.config.js /app/
COPY --chown=$UID:$GID webpack.config.js /app/

ENV PATH=/app/node_modules/.bin:$PATH
ENV BABEL_DISABLE_CACHE=1
RUN webpack

COPY --chown=$UID:$GID tsconfig.json /app/

COPY --chown=$UID:$GID cgi /app/cgi
COPY --chown=$UID:$GID server.sh /app/
