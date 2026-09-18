import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { apiFetch } from "../lib/api.js";
import { formatDate, coverUrl } from "../lib/format.js";
import StreamingLinks from "../components/StreamingLinks.jsx";

export default function MusicDetail() {
  const { slug } = useParams();
  const [music, setMusic] = useState(null);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    apiFetch('/api/v1/music/' + slug)
      .then((res) => res.json())
      .then((data) => setMusic(data))
      .catch((err) => console.error("Error fetching music:", err));
  }, [slug]);

  const handleRemove = async () => {
    if (!window.confirm(`Remove ${music.title} from your list?`)) return;
    const res = await apiFetch('/api/v1/music/' + slug, { method: "DELETE" });
    if (res.ok) {
      navigate("/music");
    } else {
      setError("Remove failed.");
    }
  };

  if (!music) return <p className="c-message">Loading</p>;
  if (music.error) return <p className="c-empty">{music.error}</p>;

  return (
    <article className="p-detail">
      <img referrerPolicy="no-referrer" className="p-detail__cover reveal" src={coverUrl(music.image, 1000)} alt={music.title} />

      <div>
        <h1 className="p-detail__title reveal">{music.title}</h1>
        <p className="p-detail__artist reveal" style={{ "--i": 1 }}>{music.artistName || "Unknown"}</p>
        <div className="c-tags reveal" style={{ "--i": 2 }}>
          <span className="c-tag">{music.type}</span>
          <StreamingLinks music={music} />
        </div>

        <dl className="c-definition reveal" style={{ "--i": 3 }}>
          <div className="c-definition__row">
            <dt>Release</dt>
            <dd>{formatDate(music.releaseDate) || "Unknown"}</dd>
          </div>
          <div className="c-definition__row">
            <dt>Tracks</dt>
            <dd>{music.totalTracks}</dd>
          </div>
          {music.artists && music.artists.length > 0 && (
            <div className="c-definition__row">
              <dt>Artists</dt>
              <dd>
                {music.artists.map((artist) => (
                  <div key={artist._id} className="c-artist">
                    {artist.image && <img referrerPolicy="no-referrer" src={coverUrl(artist.image, 100)} alt="" />}
                    <span>{artist.name}</span>
                  </div>
                ))}
              </dd>
            </div>
          )}
          {music.markedDate && (
            <div className="c-definition__row">
              <dt>Added</dt>
              <dd>{formatDate(music.markedDate)}</dd>
            </div>
          )}
        </dl>

        <p className="c-subhead">Description</p>
        <p className="c-prose">{music.description || "No description."}</p>

        {music.inLibrary && (
          <div className="p-detail__footer">
            <button type="button" className="c-text-button c-underline" onClick={handleRemove}>Remove from my list</button>
            {error && <p className="c-message c-message--error">{error}</p>}
          </div>
        )}
      </div>
    </article>
  );
}
