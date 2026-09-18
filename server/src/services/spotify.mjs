import SpotifyWebApi from "spotify-web-api-node";

// Spotify API
const spotifyApi = new SpotifyWebApi({
  clientId: process.env.SPOTIFY_CLIENT_ID,
  clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
});

let tokenExpiresAt = 0;

// client credentials tokens only live for an hour, so refresh before each call if needed
async function ensureToken() {
  if (Date.now() < tokenExpiresAt) {
    return;
  }
  const data = await spotifyApi.clientCredentialsGrant();
  spotifyApi.setAccessToken(data.body['access_token']);
  tokenExpiresAt = Date.now() + (data.body['expires_in'] - 60) * 1000;
  console.log("Spotify access token retrieved");
}

// Spotify album object -> the fields of our Music
export function spotifyAlbumToMusic(album) {
  let curType = album.album_type;
  if (curType !== "album" && curType !== "single") {
    curType = "other";
  }
  return {
    title: album.name,
    spotifyId: album.id,
    spotifyUrl: album.external_urls.spotify,
    image: album.images[0]?.url || "",
    type: curType,
    totalTracks: album.total_tracks,
    releaseDate: album.release_date,
    description: `This is ${album.name} and the Spotify URL is ${album.external_urls.spotify}`,
    artistName: album.artists.map(artist => artist.name).join(", "),
    rawArtists: album.artists,
  };
}

export async function searchSpotifyAlbums(query, limit = 10) {
  try {
    await ensureToken();
    const data = await spotifyApi.searchAlbums(query, { limit });
    return data.body.albums.items.map(spotifyAlbumToMusic);
  } catch (err) {
    // WebapiError only says "[object Object]", so build a readable message
    let message = `Spotify API responded ${err.statusCode || err.message}`;
    if (err.statusCode === 403) {
      message += " (the owner of the Spotify app needs an active Premium subscription)";
    }
    throw new Error(message);
  }
}

export async function getSpotifyArtistImage(artistId) {
  try {
    await ensureToken();
    const data = await spotifyApi.getArtist(artistId);
    return data.body.images[0]?.url || "";
  } catch (err) {
    console.error("Error retrieving artist image:", err);
    return "";
  }
}
