import { execFile } from "child_process";
import { existsSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const crawlerDir = path.join(__dirname, "../../../crawler");

function pythonBin() {
  if (process.env.PYTHON_BIN) {
    return process.env.PYTHON_BIN;
  }
  const venvPython = path.join(crawlerDir, ".venv/bin/python");
  return existsSync(venvPython) ? venvPython : "python3";
}

// run crawler/cli.py, it prints one line of JSON: { ok, data } or { ok, error }
function runCrawler(args) {
  return new Promise((resolve, reject) => {
    execFile(pythonBin(), ["cli.py", ...args], { cwd: crawlerDir, timeout: 20000 }, (err, stdout, stderr) => {
      let parsed = null;
      try {
        parsed = JSON.parse(stdout);
      } catch {
        // stdout was not JSON, fall through to the error below
      }
      if (parsed?.ok) {
        return resolve(parsed.data);
      }
      reject(new Error(parsed?.error || err?.message || stderr || "NetEase crawler failed"));
    });
  });
}

// crawler dict -> the same shape that the Spotify search gives
function toMusic(album) {
  const isSingle = album.total_tracks > 0 && album.total_tracks <= 3;
  return {
    title: album.title,
    neteaseId: album.album_id,
    neteaseUrl: album.url,
    image: album.cover_url || "",
    type: isSingle ? "single" : "album",
    totalTracks: album.total_tracks || 0,
    releaseDate: album.release_date || "",
    description: album.description || "",
    artistName: album.artists.join(", "),
    rawArtists: [],
  };
}

// "https://music.163.com/#/album?id=1698619&userid=..." -> true
export function isNeteaseAlbumUrl(text) {
  return /music\.163\.com\/.*album.*[?&]id=\d+/.test(text);
}

export async function getNeteaseAlbum(url) {
  return toMusic(await runCrawler(["album", "--url", url]));
}

export async function searchNeteaseAlbums(keyword, limit = 10) {
  const albums = await runCrawler(["search", "--keyword", keyword, "--limit", String(limit)]);
  return albums.map(toMusic);
}
