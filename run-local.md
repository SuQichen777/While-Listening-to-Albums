# Run Locally 本地开发

## Requirements 需要的东西

- Node.js 20+
- Python 3.9+
- MongoDB（本地的 `mongod` 或者 MongoDB Atlas 都可以）
- 一个 [Spotify app](https://developer.spotify.com/dashboard) 的 Client ID 和 Client Secret

> ⚠️ Spotify 现在要求 app 的所有者有 **Premium 订阅**，否则 Web API 会一直返回 403。这种情况下搜索页会给出提示，并且只显示网易云的结果。
> Spotify now requires the owner of the app to have an active **Premium subscription**, otherwise the Web API answers 403. The search page then shows a warning and only lists NetEase results.

## Docker 一键启动

不想装 Node / Python / MongoDB 的话，只需要 Docker：

```bash
cp .env.example .env
```

在 `.env` 里填好 `SPOTIFY_CLIENT_ID` 和 `SPOTIFY_CLIENT_SECRET`（`DSN` 不用管，compose 里会指向自带的 mongo 容器），然后：

```bash
docker compose up --build -d
```

打开 http://localhost:3000 。镜像里包含 build 好的前端、Express 后端和 Python 爬虫，数据存在 `mongo-data` 这个 volume 里。

```bash
docker compose logs -f app
```

```bash
docker compose down
```

（`docker compose down -v` 会连数据库数据一起删掉。）

> MongoDB 镜像用的是 `mongo:8.2`：`mongo:8` / `mongo:latest` 在比较新的 Docker Desktop（Linux 内核 6.19+）上会拒绝启动，见 [SERVER-121912](https://jira.mongodb.org/browse/SERVER-121912)。

## 1. Install 安装依赖

```bash
npm run install:all
```

```bash
python3 -m venv crawler/.venv
```

```bash
crawler/.venv/bin/pip install -r crawler/requirements.txt
```

后端默认用 `crawler/.venv/bin/python` 来跑爬虫，没有的话用 `python3`，也可以用环境变量 `PYTHON_BIN` 指定。

## 2. Environment 环境变量

把 `.env.example` 复制成 `.env`（放在根目录或者 `server/` 都可以）然后填好：

```bash
cp .env.example .env
```

| Name | Meaning |
| --- | --- |
| `DSN` | MongoDB connection string, e.g. `mongodb://127.0.0.1:27017/while-listening-to-albums` |
| `SPOTIFY_CLIENT_ID` / `SPOTIFY_CLIENT_SECRET` | Spotify app credentials |
| `PORT` | port of the backend, default 3000 |
| `PYTHON_BIN` | optional, python used to run the crawler |

## 3. Start 启动

```bash
npm start
```

- 前端 Vite dev server: http://localhost:5173 （`/api/v1` 会被代理到 3000）
- 后端 Express: http://localhost:3000

或者像部署一样只跑后端，由 Express 来 serve build 好的前端（`run.sh` 做的就是这件事）：

```bash
npm --prefix client run build && npm run server
```

## 4. Test & Lint 测试

```bash
npm test
```

```bash
npm --prefix server run lint && npm --prefix client run lint
```

`mongodb-memory-server` 第一次跑会下载一个 mongod，如果本机已经装了，可以直接用它：

```bash
MONGOMS_SYSTEM_BINARY=$(which mongod) npm test
```

## Crawler 单独使用爬虫

```bash
cd crawler && .venv/bin/python cli.py search --keyword "船骸" --limit 5
```

```bash
cd crawler && .venv/bin/python cli.py album --url "https://music.163.com/#/album?id=1698619"
```

直接运行 `get_album.py` 是原来的交互模式，会把专辑存进 `netEaseGetterDSN` 指向的 MongoDB（需要 `crawler/.env`）。

## API

| Method | Path | Body |
| --- | --- | --- |
| GET | `/api/v1/music/all` | |
| GET | `/api/v1/music/:slug` | |
| POST | `/api/v1/music/search` | `{ "title": "关键词 或者 网易云专辑链接" }` → `{ results, sources }` |
| POST | `/api/v1/music/add` | 搜索结果里的一项 one item of `results` |
| GET | `/api/v1/blog/all` | |
| GET | `/api/v1/blog/:slug` | |
| POST | `/api/v1/blog/create` | `{ title, content, cover?, rate?, referredWork? }` |
