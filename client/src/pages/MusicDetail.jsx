import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { apiFetch } from "../lib/api.js";
import StreamingLinks from "../components/StreamingLinks.jsx";

export default function MusicDetail() {
  const { slug } = useParams();
  const [music, setMusic] = useState(null);

  useEffect(() => {
    apiFetch('/api/v1/music/' + slug)
      .then((res) => res.json())
      .then((data) => setMusic(data))
      .catch((err) => console.error("Error fetching music:", err));
  }, [slug]);

  if (!music) return <div>Loading...</div>;
  if (music.error) return <div>{music.error}</div>;

  return (
    <div style={{ maxWidth: "800px", margin: "2rem auto", padding: "1.5rem", backgroundColor: "#fff", borderRadius: "12px", boxShadow: "0 4px 12px rgba(0,0,0,0.1)", textAlign: "left" }}>
      <h1 style={{ textAlign: "center", marginBottom: "2rem" }}>{music.title}</h1>

      {music.image && (
        <div style={{ textAlign: "center", marginBottom: "1rem" }}>
          <img referrerPolicy="no-referrer" src={music.image} alt={music.title} style={{ width: "300px", borderRadius: "10px", objectFit: "cover" }} />
        </div>
      )}

      <div style={{ textAlign: "center", marginBottom: "2rem" }}>
        <StreamingLinks music={music} />
      </div>

      {music.artists && music.artists.length > 0 && (
        <div style={{ marginBottom: "1.5rem" }}>
          <h2>Artists</h2>
          <ul style={{ listStyle: "none", paddingLeft: 0 }}>
            {music.artists.map((artist) => (
              <li key={artist._id} style={{ display: "flex", alignItems: "center", marginBottom: "0.75rem" }}>
                {artist.image && (
                  <img referrerPolicy="no-referrer"
                    src={artist.image}
                    alt={artist.name}
                    style={{ width: "50px", height: "50px", objectFit: "cover", borderRadius: "50%", marginRight: "0.75rem", border: "1px solid #ddd" }}
                  />
                )}
                <span style={{ fontSize: "1.1rem" }}>{artist.name}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div style={{ marginBottom: "1rem" }}>
        <strong>Type:</strong> {music.type}
      </div>

      <div style={{ marginBottom: "1rem" }}>
        <strong>Release Date:</strong> {music.releaseDate ? new Date(music.releaseDate).toLocaleDateString() : "Unknown"}
      </div>

      <div style={{ marginBottom: "1rem" }}>
        <strong>Tracks:</strong> {music.totalTracks}
      </div>

      <div style={{ marginBottom: "1rem" }}>
        <strong>Description:</strong>
        <p style={{ marginTop: "0.5rem", lineHeight: "1.6", whiteSpace: "pre-wrap" }}>
          {music.description || "No description."}
        </p>
      </div>
    </div>
  );
}
