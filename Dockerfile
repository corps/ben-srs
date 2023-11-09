FROM ben-srs:node
FROM ben-srs:python

COPY --from=0 /app/docs /app/flask_server/docs
