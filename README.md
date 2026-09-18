# While-Listening-to-Albums 听专辑的时候我在想些什么

听专辑的时候我在想些什么（While Listening to Albums）是一款听歌记录软件，旨在帮助用户记录和分享他们在听专辑时的想法和感受。用户可以搜索专辑，查看专辑详情，记录自己的听歌笔记，并与其他用户分享。

While Listening to Albums is a music journaling app that helps users record and share their thoughts and feelings while listening to albums. You can search for albums, view album details, write your own listening notes, and share them with others.

## Features 功能

你或许会觉得，这款软件和豆瓣很像，其实确实如此。豆瓣的专辑页面也有类似的功能，但我希望在这个基础上，增加一些新的功能，比如：

At first glance, this app may remind you of Douban’s album pages, and that’s true — the idea is similar. But I’d like to expand on that foundation with new features such as:

- 完全私人化的听歌笔记和乐评，你可以选择完全不公开任何体验。Private listening notes and reviews: you can choose to keep all of your experiences completely private.
- 更加细分的评分规则，不是 1-5 星，而是 1-10 分。More granular rating scale: not just 1–5 stars, but a 1–10 score system.
  - 你当然可以使用小数点。You can absolutely use decimal scores.
- 使用专辑封面拼图”我听过的所有专辑“，“我 2023 年听过的专辑”等等。Album cover collages: create mosaics like “All the albums I’ve listened to” or “Albums I listened to in 2023.”
  - 可以一键导出拼图。Export collages with one click.
  - 给专辑增加“简单印象”，比如一个词，一个颜色，可以直接在拼图上显示。Add a “quick impression” (a word, a color) to each album, displayed directly on the collage.
  - 也可以做成“月历”，这样的话就会有些空位。Optionally display them as a calendar view, with empty slots for days you didn’t log albums.
- 对于任何专辑都能直接跳转到对应的流媒体。Jump directly to streaming platforms for any album:
  - Spotify
  - 网易云。NetEase Cloud Music
  - ……and more
- “那年今日”功能，推荐去年今天你听过的专辑和你当时的评分。“On This Day” reminders: revisit what you were listening to exactly one year ago, along with your old rating.
- 评分热力图。像是 Github 的贡献热力图一样，记录你每天听了多少专辑。Listening activity heatmap: inspired by GitHub’s contribution graph, showing how many albums you listened to each day.
  - 所以或许我们会对于每个用户允许每首歌都有很多条“听歌记录”，而不是一首歌只有一条。Each track can have multiple “listening logs,” rather than just one.
  - 不如让我们做个带图片的时间轴。A timeline view with album covers and notes.
- 评分曲线图。Rating trends and charts:
  - 你可以看到你在不同时间段的评分变化。Visualize how your ratings change over time.
  - 我最近变成“懂哥”了吗？我最近变得“苛刻”了吗？See if you’re becoming more generous… or more critical.
- 不仅是“我听过的专辑”，还有“我想听的专辑”。Want-to-listen list:
  - 你可以把你想听的专辑添加到“想听”列表，同样你也能一键跳转到对应的流媒体。Add albums you’d like to check out, with one-click access to streaming services.
- 提醒。Reminders by email:
  - 如果你愿意留下你的邮箱，我们可以在你标注想听后的某个时间点，给你发一封邮件，提醒你去听这张专辑。If you leave your email, we can notify you at a chosen time after you add an album to your “Want to Listen” list, reminding you to give it a spin.

## Project Overview 项目概览

### Status 进度

项目的骨架迁移自我的 AIT 期末项目 Rewind Archive（去掉了影视部分，保留 Spotify 部分），并且接入了网易云爬虫。目前已经完成：

The skeleton is migrated from my AIT final project Rewind Archive (screen part removed, Spotify part kept), with the NetEase crawler plugged in. Done so far:

- 搜索：同时搜 Spotify 和网易云，两边的同一张专辑会合并成一条结果，带两个平台的跳转链接。Search Spotify and NetEase at once; the same album on both platforms is merged into one result with both streaming links.
- 直接贴一个网易云专辑链接也可以：爬虫先抓专辑信息，再去 Spotify 找对应的专辑。Pasting a NetEase album link works too: the crawler fetches the album, then the server looks it up on Spotify.
- 把搜索结果加入“我的音乐”，专辑/单曲列表、详情页。Add results to your music, album / single lists, detail page.
- Blog（听歌笔记），可以关联多张专辑，1-10 分并且支持小数。Blogs (listening notes) referring to multiple albums, rated 1-10 with decimals.

### Structure 结构

```bash
While-Listening-to-Albums/
├── client/                         # 前端 React (Vite) + react-router
│   └── src/
│       ├── components/             # Tabs, SearchBar, FloatingButton, StreamingLinks
│       ├── pages/                  # MusicList, AlbumList, SingleList, MusicDetail, MusicSearch, BlogList, BlogNew, BlogDetail
│       ├── lib/api.js              # apiFetch，VITE_API_BASE 可以指向别的后端
│       ├── App.jsx                 # 路由
│       └── main.jsx
│
├── server/                         # 后端 Node.js + Express + Mongoose
│   ├── src/
│   │   ├── app.mjs                 # 入口：挂载路由，serve client/dist
│   │   ├── config.mjs              # 读 .env（根目录或者 server/ 都可以）
│   │   ├── models/db.mjs           # Artist, Music, Blog
│   │   ├── routes/
│   │   │   ├── musicRoutes.mjs     # /api/v1/music  all, :slug, search, add
│   │   │   └── blogRoutes.mjs      # /api/v1/blog   all, :slug, create
│   │   └── services/
│   │       ├── spotify.mjs         # Spotify Web API（token 自动刷新）
│   │       ├── netease.mjs         # 用子进程调用 crawler/cli.py
│   │       └── merge.mjs           # 合并 Spotify 和网易云的搜索结果
│   └── test/                       # Mocha + Chai (+ mongodb-memory-server)
│
├── crawler/                        # 🐍 网易云爬虫
│   ├── get_album.py                # get_album_info / search_albums，直接运行是交互模式（会存库）
│   ├── cli.py                      # 给后端用的入口，stdout 只输出 JSON
│   ├── models/albums.py
│   ├── .env.example                # netEaseGetterDSN=MONGO_URI（只有交互模式需要）
│   └── requirements.txt
│
├── .env.example                    # DSN, SPOTIFY_CLIENT_ID, SPOTIFY_CLIENT_SECRET, PORT
├── package.json                    # npm start 同时启动前后端
├── run.sh                          # 一键 build + test + start（部署用）
├── Dockerfile                      # 前端 build + Express + Python 爬虫 打成一个镜像
├── docker-compose.yml              # docker compose up --build：app + mongo
├── README.md
└── run-local.md                    # 本地开发说明
```

## Local Development 本地开发

这是一个 MERN 开源项目（MongoDB + Express + React + Node.js），外加一个 Python 爬虫。如果你想 contribute 或者魔改自己的版本，请参考 [`run-local.md`](run-local.md)。

This is a MERN project (MongoDB + Express + React + Node.js) plus a Python crawler. See [`run-local.md`](run-local.md) for how to run it locally.
