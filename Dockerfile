FROM bensrs:base-image
ENV PATH=/app/venv/bin:$PATH
ENV PATH=/app/node_modules/.bin:$PATH

RUN python -m venv venv
COPY requirements.txt /app/
RUN pip install -r requirements.txt

COPY package.json /app/
COPY package-lock.json /app/
RUN npm install

COPY src /app/src
COPY babel.config.js /app/
COPY webpack.config.js /app/
COPY tsconfig.json /app/
ENV BABEL_DISABLE_CACHE=1
ENV NODE_ENV=production
RUN webpack

COPY wsgi.py /app/
COPY __init__.py /app/

CMD flask run -p 3000 --reload

