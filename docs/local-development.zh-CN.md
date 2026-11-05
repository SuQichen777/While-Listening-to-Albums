# 本地开发

[English](local-development.md) · **简体中文** · [← 回到 README](../README.zh-CN.md)

## 需要的东西

- Node.js 20+
- Python 3.9+
- MongoDB：本地的 `mongod` 或者 MongoDB Atlas 都可以
- 一个 [Spotify app](https://developer.spotify.com/dashboard) 的 Client ID 和 Client Secret

> [!NOTE]
> Spotify 要求 app 的所有者拥有有效的 Premium 订阅，否则 Web API 会一直返回 `403`。这种情况下搜索页会给出提示，并且只显示网易云的结果。

## 用 Docker 启动

```bash
cp .env.example .env
```

填好 `SPOTIFY_CLIENT_ID`、`SPOTIFY_CLIENT_SECRET` 和 `JWT_SECRET`。`DSN` 不用管：在 Compose 里它始终指向自带的 `mongo` 服务。

```bash
docker compose up --build -d
```

打开 <http://localhost:3000>。镜像里包含 build 好的前端、Express 后端和 Python 爬虫，数据存在 `mongo-data` 这个 volume 里。

```bash
docker compose logs -f app
```

```bash
docker compose down
```

`docker compose down -v` 会连数据库数据一起删掉。

> [!NOTE]
> MongoDB 镜像固定为 `mongo:8.2`。`mongo:8` 和 `mongo:latest` 在比较新的 Docker Desktop 内核（Linux 6.19+）上会拒绝启动，见 [SERVER-121912](https://jira.mongodb.org/browse/SERVER-121912)。

## 不用 Docker

### 1. 安装依赖

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

### 2. 环境变量

把 `.env.example` 复制成 `.env`，放在根目录或者 `server/` 都可以。

| 名称 | 含义 |
| --- | --- |
| `DSN` | MongoDB 连接字符串，例如 `mongodb://127.0.0.1:27017/while-listening-to-albums` |
| `SPOTIFY_CLIENT_ID` / `SPOTIFY_CLIENT_SECRET` | Spotify app 的凭证 |
| `JWT_SECRET` | 用来签发登录 token，请使用足够长的随机字符串：`openssl rand -hex 32`。如果不设置，每次启动会随机生成一个，重启后所有人都会被登出。 |
| `PORT` | 后端端口，默认 `3000` |
| `PYTHON_BIN` | 可选，用来跑爬虫的 Python |
| `TRUST_PROXY` | 可选，服务器前面反向代理的层数，让登录限流能拿到真实的客户端 IP |

### 3. 启动

```bash
npm start
```

- 前端 Vite dev server：<http://localhost:5173>（`/api/v1` 会被代理到 3000）
- 后端 Express：<http://localhost:3000>

或者像部署一样只跑后端，由 Express 来 serve build 好的前端（`run.sh` 做的就是这件事）：

```bash
npm --prefix client run build && npm run server
```

## 测试与 Lint

```bash
npm test
```

```bash
npm --prefix server run lint && npm --prefix client run lint
```

`mongodb-memory-server` 第一次跑会下载一个 `mongod`，如果本机已经装了，可以直接用它：

```bash
MONGOMS_SYSTEM_BINARY=$(which mongod) npm test
```

## 单独使用爬虫

```bash
cd crawler && .venv/bin/python cli.py search --keyword "船骸" --limit 5
```

```bash
cd crawler && .venv/bin/python cli.py album --url "https://music.163.com/#/album?id=1698619"
```

`cli.py` 只会在 stdout 输出一行 JSON（`{ "ok": true, "data": ... }`），日志都走 stderr。直接运行 `get_album.py` 是原来的交互模式，会把专辑存进 `crawler/.env` 里 `netEaseGetterDSN` 指向的 MongoDB。

## 账号与数据模型

- 密码使用 bcrypt（cost 12）哈希存储，API 永远不会返回密码。用户名不区分大小写地唯一，邮箱是可选的。
- 登录后会拿到一个 7 天有效的 JWT。前端把它存在 `localStorage` 里，并以 `Authorization: Bearer <token>` 的形式发送。每次请求都会查一次用户，所以删除用户之后他的登录状态会立刻失效。
- `Music` 和 `Artist` 是所有用户共享的专辑库。`Mark` 把一个用户和一条音乐关联起来，“我的列表”就是你的所有 mark。两个用户添加同一张专辑时会复用同一条记录，并且补上它原来缺少的流媒体链接。
- `Blog` 属于它的作者，除非设置了 `isPublic`，否则是私密的。访问别人的私密 Blog 会得到 `404`，和不存在的 Blog 完全一样。

## API

所有路径都在 `/api/v1` 下。除了注册和登录，其他请求都要带上 `Authorization: Bearer <token>`。出错时的格式是 `{ "error": "message" }`。

| 方法 | 路径 | 请求体 | 响应 |
| --- | --- | --- | --- |
| `POST` | `/auth/register` | `{ username, password, email? }` | `201 { token, user }` |
| `POST` | `/auth/login` | `{ login, password }`，`login` 是用户名或邮箱 | `{ token, user }` |
| `GET` | `/auth/me` | | `{ user }` |
| `POST` | `/music/search` | `{ title }`，关键词或者网易云专辑链接 | `{ results, sources }` |
| `POST` | `/music/add` | `results` 里的一项 | `201 { success, slug }` |
| `GET` | `/music/all` | | 自己的音乐，最新的在前 |
| `GET` | `/music/:slug` | | 音乐详情，带 `artists` 和 `inLibrary` |
| `DELETE` | `/music/:slug` | | `{ success }` |
| `POST` | `/blog/create` | `{ title, content, cover?, rate?, isPublic?, referredWork? }` | `201 { success, blogId, slug }` |
| `GET` | `/blog/all` | | 自己的 Blog，最新的在前 |
| `GET` | `/blog/:slug` | | Blog 详情，带 `isMine` 和解析好的 `referredWork` |

`sources` 的样子是 `{ "spotify": "ok", "netease": "error", "neteaseError": "..." }`。
