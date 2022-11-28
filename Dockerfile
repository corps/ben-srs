FROM bensrs:base-image

COPY --chown=bensrs package.json /app/
COPY --chown=bensrs package-lock.json /app/
RUN npm install
COPY --chown=bensrs src /app/src
COPY --chown=bensrs babel.config.js /app/
COPY --chown=bensrs webpack.config.js /app/
COPY --chown=bensrs tsconfig.json /app/

COPY --chown=bensrs requirements.txt /app/
RUN pip install -r requirements.txt

ENV PATH=/app/node_modules/.bin:$PATH
ENV BABEL_DISABLE_CACHE=1
ENV NODE_ENV=production
RUN webpack

# CMD websocketd --port 3000 --staticdir docs ./src/server.ts
CMD uwsgi --ini wsgi.ini

