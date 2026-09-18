import { useState } from "react";
import { apiFetch } from "../lib/api.js";
import { formatDate, revealStyle, coverUrl } from "../lib/format.js";
import SectionHead from "../components/SectionHead.jsx";
import StreamingLinks from "../components/StreamingLinks.jsx";

export default function MusicSearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [sources, setSources] = useState({});
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [added, setAdded] = useState({});
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setError("");
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
        setError(`Search failed: ${data.error}`);
      }
    } catch (err) {
      console.error("Search failed", err);
      setError("Search failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async (music, index) => {
    setError("");
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
        setError(`${music.title}: ${data.error}`);
      }
    } catch (err) {
      console.error(err);
      setError("Add failed.");
    }
  };

  const failedSources = ["spotify", "netease"].filter((name) => sources[name] === "error");

  return (
    <div>
      <SectionHead title="Search" linkTo="/music" linkLabel="My Music" />

      <form onSubmit={handleSubmit} className="c-search">
        <input
          type="text"
          className="c-input"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Album title, or a 网易云 album link"
          aria-label="Album title, or a NetEase album link"
        />
        <button type="submit" className="c-pill c-pill--fill" disabled={loading}>
          {loading ? "Searching" : "Search"}
        </button>
      </form>

      {error && <p className="c-message c-message--error" style={{ marginBottom: 24 }}>{error}</p>}
      {failedSources.length > 0 && (
        <p className="c-message" style={{ marginBottom: 24 }}>
          ※ {failedSources.map((name) => sources[`${name}Error`] || `${name} search failed`).join("; ")}. Showing the rest.
        </p>
      )}
      {searched && results.length === 0 && <p className="c-empty">No results.</p>}

      {results.length > 0 && (
        <ul className="c-list">
          {results.map((music, index) => (
            <li key={index} className="c-list__item reveal" style={revealStyle(index)}>
              <div className="c-list__row">
                <img referrerPolicy="no-referrer" className="c-list__image" src={coverUrl(music.image, 200)} alt="" />
                <div className="c-list__body">
                  <p className="c-list__title">
                    {music.title} <span className="c-list__sub">/ {music.artistName || "Unknown"}</span>
                  </p>
                  <div className="c-tags">
                    <span className="c-tag">{music.type}</span>
                    <StreamingLinks music={music} />
                    <span className="c-date">{formatDate(music.releaseDate) || "Unknown date"} / {music.totalTracks} tracks</span>
                  </div>
                </div>
                <button type="button" className="c-pill" onClick={() => handleAdd(music, index)} disabled={added[index]}>
                  {added[index] ? "Added" : "Add"}
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
