// Merge Spotify results and NetEase results into one list.
// The same album on both platforms becomes one item carrying both links.

// "OK Computer (Remastered)" / "ok computer" -> "okcomputer"
export function normalize(text) {
  return (text || "")
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[([（【].*?[)\]）】]/g, "")
    .replace(/[^\p{L}\p{N}]/gu, "");
}

function artistList(artistName) {
  return (artistName || "").split(/[,/&、]/).map(normalize).filter(name => name);
}

export function isSameAlbum(a, b) {
  const titleA = normalize(a.title);
  const titleB = normalize(b.title);
  if (!titleA || titleA !== titleB) {
    return false;
  }
  const artistsA = artistList(a.artistName);
  const artistsB = artistList(b.artistName);
  if (artistsA.length === 0 || artistsB.length === 0) {
    return true;
  }
  // artist names are often translated (周杰伦 / Jay Chou), so a same-year release also counts
  const sameArtist = artistsA.some(x => artistsB.some(y => x.includes(y) || y.includes(x)));
  const yearA = String(a.releaseDate || "").slice(0, 4);
  const yearB = String(b.releaseDate || "").slice(0, 4);
  return sameArtist || (yearA !== "" && yearA === yearB);
}

export function mergeResults(spotifyList, neteaseList) {
  const rest = [...neteaseList];
  const merged = spotifyList.map(item => {
    const index = rest.findIndex(candidate => isSameAlbum(item, candidate));
    if (index === -1) {
      return { neteaseId: "", neteaseUrl: "", ...item };
    }
    const [match] = rest.splice(index, 1);
    return {
      ...item,
      neteaseId: match.neteaseId,
      neteaseUrl: match.neteaseUrl,
      // Spotify has no album description, NetEase often does
      description: match.description && match.description !== "无简介" ? match.description : item.description,
    };
  });
  // NetEase-only albums go after the Spotify ones
  return [...merged, ...rest.map(item => ({ spotifyId: "", spotifyUrl: "", ...item }))];
}
