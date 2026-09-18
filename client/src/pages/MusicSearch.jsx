import { useState } from "react";
import { apiFetch } from "../lib/api.js";
import StreamingLinks from "../components/StreamingLinks.jsx";

export default function MusicSearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [sources, setSources] = useState({});
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [added, setAdded] = useState({});

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    try {
      const res = await apiFetch("/api/v1/music/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: query })
      });
      const data = await res.json();
      if (res.ok) {
        setResults(data.results);
        setSources(data.sources);
        setAdded({});
        setSearched(true);
      } else {
        console.error("Error:", data);
        alert("❌ Search failed: " + data.error);
      }
    } catch (err) {
      console.error("Search failed", err);
      alert("❌ Search failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async (music, index) => {
    try {
      const res = await apiFetch("/api/v1/music/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(music)
      });

      if (res.ok) {
        setAdded((prev) => ({ ...prev, [index]: true }));
      } else {
        const data = await res.json();
        alert(`❌ Error adding ${music.title}: ${data.error}`);
      }
    } catch (err) {
      console.error(err);
      alert("❌ Add failed.");
    }
  };

  const failedSources = ["spotify", "netease"].filter((name) => sources[name] === "error");

  return (
    <div>
      <h1>Search from Spotify & 网易云</h1>
      <form onSubmit={handleSubmit} style={{ marginBottom: "1rem" }}>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Album title, or a 网易云 album link"
          style={{ padding: "0.5rem", width: "400px" }}
        />
        <button type="submit" disabled={loading} style={{ padding: "0.5rem 1rem", marginLeft: "0.5rem" }}>
          {loading ? "Searching..." : "Search"}
        </button>
      </form>

      {failedSources.length > 0 && (
        <p className="search-warning">⚠️ {failedSources.map((name) => sources[`${name}Error`] || `${name} search failed`).join("; ")}. Showing the rest.</p>
      )}
      {searched && results.length === 0 && <p>No results.</p>}

      <ul>
        {results.map((music, index) => (
          <li key={index} className="music-item">
            <img referrerPolicy="no-referrer" src={music.image} alt={music.title} width="100" />
            <div style={{ flex: 1, textAlign: "left" }}>
              <p>{music.title} - {music.artistName || "Unknown"}</p>
              <p className="music-meta">
                {music.type} · {music.releaseDate || "Unknown date"} · {music.totalTracks} tracks
              </p>
              <StreamingLinks music={music} />
            </div>
            <button onClick={() => handleAdd(music, index)} disabled={added[index]}>
              {added[index] ? "Added ✓" : "Add"}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
