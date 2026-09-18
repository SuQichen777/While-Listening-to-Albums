import express from "express";
import { Artist, Music } from "../models/db.mjs";
import { searchSpotifyAlbums, getSpotifyArtistImage } from "../services/spotify.mjs";
import { isNeteaseAlbumUrl, getNeteaseAlbum, searchNeteaseAlbums } from "../services/netease.mjs";
import { mergeResults } from "../services/merge.mjs";
const router = express.Router();

router.get('/all', async (req, res) => {
  // show all music
  try {
    const music = await Music.find();
    res.json(music);
  } catch (err) {
    console.error(err);
    res.status(500).send('Error retrieving music');
  }
});
// Specific Music Detail Page
router.get('/:slug', async (req, res) => {
  try {
    const music = await Music.findOne({ slug: req.params.slug }).populate("artists");
    if (!music) {
      return res.status(404).json({ error: 'Music not found' });
    }
    res.json(music);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// one source failing should not kill the whole search
async function trySource(name, promise, sources) {
  try {
    const list = await promise;
    sources[name] = "ok";
    return list;
  } catch (err) {
    console.error(`${name} search failed:`, err.message || err);
    sources[name] = "error";
    sources[`${name}Error`] = err.message || String(err);
    return [];
  }
}

// Search Spotify and NetEase at the same time.
// title can be a keyword, or the URL of a NetEase album page.
router.post('/search', async (req, res) => {
  const title = (req.body.title || "").trim();
  if (!title) {
    return res.status(400).json({ error: "Title is required" });
  }
  const sources = {};

  try {
    if (isNeteaseAlbumUrl(title)) {
      // crawl the album first, then look for it on Spotify
      const album = await getNeteaseAlbum(title);
      sources.netease = "ok";
      const firstArtist = album.artistName.split(", ")[0];
      let spotifyList = await trySource("spotify", searchSpotifyAlbums(`${album.title} ${firstArtist}`, 5), sources);
      if (spotifyList.length === 0 && sources.spotify === "ok") {
        // the artist may have another name on Spotify
        spotifyList = await trySource("spotify", searchSpotifyAlbums(album.title, 5), sources);
      }
      const merged = mergeResults(spotifyList, [album]);
      // the crawled album (matched or not) always comes first
      merged.sort((a, b) => (b.neteaseId === album.neteaseId) - (a.neteaseId === album.neteaseId));
      return res.json({ results: merged, sources });
    }

    const [spotifyList, neteaseList] = await Promise.all([
      trySource("spotify", searchSpotifyAlbums(title), sources),
      trySource("netease", searchNeteaseAlbums(title), sources),
    ]);
    if (sources.spotify === "error" && sources.netease === "error") {
      return res.status(500).json({ error: "Spotify and NetEase search both failed" });
    }
    return res.json({ results: mergeResults(spotifyList, neteaseList), sources });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message || "Search failed" });
  }
});

// find the artists in db, or create them
async function resolveArtists(rawArtists, artistName) {
  const artistObjectIds = [];

  for (const artistData of rawArtists) {
    let artist = await Artist.findOne({ spotifyId: artistData.id });
    if (!artist) {
      artist = new Artist({
        name: artistData.name,
        image: await getSpotifyArtistImage(artistData.id),
        spotifyId: artistData.id,
        description: `This is ${artistData.name} and the Spotify URL is ${artistData.external_urls?.spotify}`,
      });
      await artist.save();
    }
    artistObjectIds.push(artist._id);
  }

  if (artistObjectIds.length === 0) {
    // NetEase-only music has no Spotify artist, so go by name
    for (const name of (artistName || "").split(", ").filter(n => n)) {
      const artist = await Artist.findOne({ name }) || await Artist.create({ name });
      artistObjectIds.push(artist._id);
    }
  }
  return artistObjectIds;
}

// Add Music
router.post('/add', async (req, res) => {
  const { title, spotifyId, spotifyUrl, neteaseId, neteaseUrl, image, type, totalTracks, releaseDate, description, artistName, rawArtists } = req.body;
  if (!title) {
    return res.status(400).json({ error: "Title is required" });
  }

  try {
    const existingMusic = await Music.findOne({ title, artistName });
    if (existingMusic) {
      return res.status(400).json({ error: "Music already exists" });
    }

    const newMusic = new Music({
      title,
      spotifyId,
      spotifyUrl,
      neteaseId,
      neteaseUrl,
      image,
      type,
      totalTracks,
      releaseDate: releaseDate || undefined,
      description,
      artistName,
      artists: await resolveArtists(rawArtists || [], artistName),
    });

    await newMusic.save();
    return res.status(201).json({ success: true, message: "Music added with artist", slug: newMusic.slug });
  } catch (err) {
    console.error("Failed to add music:", err);
    return res.status(500).json({ error: "Failed to add music" });
  }
});

export default router;
