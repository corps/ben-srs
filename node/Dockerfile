FROM node:16

WORKDIR /app

COPY package.json /app
COPY package-lock.json /app
COPY Makefile /app

RUN make installation

ENV PATH=/app/node_modules/.bin:$PATH
COPY . /app

RUN tsc -b
RUN webpack

