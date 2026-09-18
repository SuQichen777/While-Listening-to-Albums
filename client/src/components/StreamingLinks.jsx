// Jump to the streaming platforms that have this music
export default function StreamingLinks({ music }) {
  return (
    <span className="streaming-links">
      {music.spotifyUrl && (
        <a className="streaming-link spotify" href={music.spotifyUrl} target="_blank" rel="noreferrer">
          Spotify
        </a>
      )}
      {music.neteaseUrl && (
        <a className="streaming-link netease" href={music.neteaseUrl} target="_blank" rel="noreferrer">
          网易云
        </a>
      )}
    </span>
  );
}
