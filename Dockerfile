# ---------- 1. build the React client ----------
FROM node:22-slim AS client-build
WORKDIR /app/client
COPY client/package*.json ./
RUN npm ci
COPY client/ ./
RUN npm run build

# ---------- 2. runtime: Express server + Python crawler ----------
FROM node:22-slim
ENV NODE_ENV=production

# the server runs crawler/cli.py in a child process, so python is needed too
RUN apt-get update \
    && apt-get install -y --no-install-recommends python3 python3-venv \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# crawler, services/netease.mjs looks for crawler/.venv/bin/python
COPY crawler/requirements.txt crawler/requirements.txt
RUN python3 -m venv crawler/.venv \
    && crawler/.venv/bin/pip install --no-cache-dir -r crawler/requirements.txt
COPY crawler/ crawler/

# server
COPY server/package*.json server/
RUN cd server && npm ci --omit=dev
COPY server/ server/

# client/dist is served by Express
COPY --from=client-build /app/client/dist client/dist

USER node
EXPOSE 3000
CMD ["node", "server/src/app.mjs"]
