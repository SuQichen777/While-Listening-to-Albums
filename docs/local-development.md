# Local Development

**English** · [简体中文](local-development.zh-CN.md) · [← Back to README](../README.md)

## Requirements

- Node.js 20+
- Python 3.9+
- MongoDB — a local `mongod` or MongoDB Atlas
- The Client ID and Client Secret of a [Spotify app](https://developer.spotify.com/dashboard)

> [!NOTE]
> Spotify requires the owner of the app to have an active Premium subscription, otherwise the Web API answers `403`. The search page then shows a warning and only lists NetEase results.

## Run with Docker

```bash
cp .env.example .env
```

Fill in `SPOTIFY_CLIENT_ID`, `SPOTIFY_CLIENT_SECRET` and `JWT_SECRET`. `DSN` can be left alone: inside Compose it always points at the bundled `mongo` service.

```bash
docker compose up --build -d
```

Open <http://localhost:3000>. The image contains the built client, the Express server and the Python crawler; data lives in the `mongo-data` volume.

```bash
docker compose logs -f app
```

```bash
docker compose down
```

`docker compose down -v` also deletes the database.

> [!NOTE]
> The MongoDB image is pinned to `mongo:8.2`. `mongo:8` and `mongo:latest` refuse to start on recent Docker Desktop kernels (Linux 6.19+), see [SERVER-121912](https://jira.mongodb.org/browse/SERVER-121912).

## Run without Docker

### 1. Install

```bash
npm run install:all
```

```bash
python3 -m venv crawler/.venv
```

```bash
crawler/.venv/bin/pip install -r crawler/requirements.txt
```

The server runs the crawler with `crawler/.venv/bin/python` if it exists, then falls back to `python3`. Set `PYTHON_BIN` to use another interpreter.

### 2. Environment

Copy `.env.example` to `.env`, either in the repository root or in `server/`.

| Name | Meaning |
| --- | --- |
| `DSN` | MongoDB connection string, e.g. `mongodb://127.0.0.1:27017/while-listening-to-albums` |
| `SPOTIFY_CLIENT_ID` / `SPOTIFY_CLIENT_SECRET` | Spotify app credentials |
| `JWT_SECRET` | Signs the login tokens. Use a long random string: `openssl rand -hex 32`. Without it a random secret is generated on every start, which logs everyone out on restart. |
| `PORT` | Port of the backend, default `3000` |
| `PYTHON_BIN` | Optional, the Python used to run the crawler |
| `TRUST_PROXY` | Optional, number of reverse proxies in front of the server, so that the login rate limit sees the real client IP |

### 3. Start

```bash
npm start
```

- Vite dev server: <http://localhost:5173> (`/api/v1` is proxied to port 3000)
- Express: <http://localhost:3000>

To run it the way it is deployed, with Express serving the built client (this is what `run.sh` does):

```bash
npm --prefix client run build && npm run server
```

## Test and Lint

```bash
npm test
```

```bash
npm --prefix server run lint && npm --prefix client run lint
```

`mongodb-memory-server` downloads a `mongod` binary on first run. To use one that is already installed:

```bash
MONGOMS_SYSTEM_BINARY=$(which mongod) npm test
```

## Using the Crawler on Its Own

```bash
cd crawler && .venv/bin/python cli.py search --keyword "OK Computer" --limit 5
```

```bash
cd crawler && .venv/bin/python cli.py album --url "https://music.163.com/#/album?id=1698619"
```

`cli.py` prints a single line of JSON on stdout (`{ "ok": true, "data": ... }`); logs go to stderr. Running `get_album.py` directly starts the original interactive mode, which saves albums to the MongoDB given by `netEaseGetterDSN` in `crawler/.env`.

## Accounts and Data Model

- Passwords are hashed with bcrypt (cost 12) and are never returned by the API. Usernames are unique ignoring case; email is optional.
- Logging in returns a JWT that is valid for 7 days. The client keeps it in `localStorage` and sends it as `Authorization: Bearer <token>`. The user is looked up on every request, so deleting a user ends their sessions immediately.
- `Music` and `Artist` form a catalog shared by all users. A `Mark` links one user to one music; "my list" is the set of your marks. When two users add the same album, the catalog entry is reused and enriched with any streaming link it was missing.
- A `Blog` belongs to its author and is private unless `isPublic` is set. Someone else's private blog answers `404`, the same as a missing one.

## API

All paths are under `/api/v1`. Send `Authorization: Bearer <token>` for everything except register and login. Errors have the shape `{ "error": "message" }`.

| Method | Path | Body | Response |
| --- | --- | --- | --- |
| `POST` | `/auth/register` | `{ username, password, email? }` | `201 { token, user }` |
| `POST` | `/auth/login` | `{ login, password }` — `login` is a username or an email | `{ token, user }` |
| `GET` | `/auth/me` | | `{ user }` |
| `POST` | `/music/search` | `{ title }` — a keyword or a NetEase album URL | `{ results, sources }` |
| `POST` | `/music/add` | one item of `results` | `201 { success, slug }` |
| `GET` | `/music/all` | | your music, newest first |
| `GET` | `/music/:slug` | | the music, with `artists` and `inLibrary` |
| `DELETE` | `/music/:slug` | | `{ success }` |
| `POST` | `/blog/create` | `{ title, content, cover?, rate?, isPublic?, referredWork? }` | `201 { success, blogId, slug }` |
| `GET` | `/blog/all` | | your blogs, newest first |
| `GET` | `/blog/:slug` | | the blog, with `isMine` and resolved `referredWork` |

`sources` looks like `{ "spotify": "ok", "netease": "error", "neteaseError": "..." }`.
