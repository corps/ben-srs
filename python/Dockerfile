FROM corps/node:latest
FROM python:3.9

WORKDIR /app

COPY requirements.txt /app
COPY Makefile /app

RUN make installation

ENV HOST_PROTO=https
COPY . /app
COPY --from=0 /app/docs /app/flask_server/docs

RUN mkdir flask_server/data

CMD flask -A flask_server.wsgi:app run -h 0.0.0.0 -p 3000

