FROM node:16

WORKDIR /app

COPY package.json /app
COPY package-lock.json /app
RUN npm install
ENV PATH=/app/node_modules/.bin:$PATH
COPY . /app

RUN tsc -b
RUN webpack

