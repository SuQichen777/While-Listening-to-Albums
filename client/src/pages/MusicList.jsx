import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { apiFetch } from "../lib/api.js";
import SearchBar from "../components/SearchBar.jsx";

// type: "album" / "single", or nothing for all music
export default function MusicList({ type, heading = "All Music" }) {
  const [musicList, setMusicList] = useState([]);
  const [filtered, setFiltered] = useState([]);

  useEffect(() => {
    apiFetch("/api/v1/music/all")
      .then((res) => res.json())
      .then((data) => {
        const list = type ? data.filter(item => item.type === type) : data;
        setMusicList(list);
        setFiltered(list);
      })
      .catch((err) => console.error("Error fetching music:", err));
  }, [type]);

  const handleSearch = (query, field) => {
    if (query.trim() === "") {
      setFiltered(musicList);
      return;
    }
    const result = musicList.filter((item) => {
      const value = field === "title" ? item.title : item.artistName || "";
      return value.toLowerCase().includes(query.toLowerCase());
    });
    setFiltered(result);
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h1>{heading}</h1>
        <Link to="/music/search">
          <button>+ Add Music from Spotify / 网易云</button>
        </Link>
      </div>

      <SearchBar onSearch={handleSearch} />

      {filtered.length === 0 && <p>Nothing here yet.</p>}
      <ul>
        {filtered.map((music) => (
          <li key={music._id} className="music-item">
            <Link
              to={`/music/${music.slug}`}
              style={{
                display: "flex",
                gap: "1rem",
                alignItems: "center",
                textDecoration: "none",
                color: "inherit"
              }}
            >
              <img referrerPolicy="no-referrer" src={music.image} alt={music.title} width="100" />
              <p>{music.title} - {music.artistName || "Unknown"}</p>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
