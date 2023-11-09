FROM python:3.9

WORKDIR /app
ENV HOST_PROTO=https

COPY requirements.txt /app
RUN pip install -r requirements.txt
COPY . /app
RUN mypy --install-types --non-interactive
RUN mkdir flask_server/data
RUN mkdir data

#CMD flask -A flask_server.wsgi:app run -h 0.0.0.0 -p 3000
CMD flask run -h 0.0.0.0 -p 3000

