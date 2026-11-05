// Jump to the streaming platforms that have this music
export default function StreamingLinks({ music }) {
  return (
    <>
      {music.spotifyUrl && (
        <a className="c-tag c-tag--fill" href={music.spotifyUrl} target="_blank" rel="noreferrer">
          Spotify
        </a>
      )}
      {music.neteaseUrl && (
        <a className="c-tag c-tag--fill" href={music.neteaseUrl} target="_blank" rel="noreferrer">
          网易云
        </a>
      )}
    </>
  );
}
