import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { apiFetch } from "../lib/api.js";
import { revealStyle, coverUrl } from "../lib/format.js";
import SearchBar from "../components/SearchBar.jsx";
import SectionHead from "../components/SectionHead.jsx";

// type: "album" / "single", or nothing for all music
export default function MusicList({ type, heading = "My Music" }) {
  const [musicList, setMusicList] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    apiFetch("/api/v1/music/all")
      .then((res) => res.json())
      .then((data) => {
        if (!Array.isArray(data)) return; // logged out
        const list = type ? data.filter(item => item.type === type) : data;
        setMusicList(list);
        setFiltered(list);
        setLoaded(true);
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
      <SectionHead title={heading} linkTo="/music/search" linkLabel="Add from Spotify / 网易云" />

      <SearchBar onSearch={handleSearch} />

      {loaded && filtered.length === 0 && <p className="c-empty">Nothing here yet.</p>}
      <ul className="c-cover-grid">
        {filtered.map((music, index) => (
          <li key={music._id} className="reveal" style={revealStyle(index)}>
            <Link to={`/music/${music.slug}`} className="c-cover">
              <img referrerPolicy="no-referrer" className="c-cover__image" src={coverUrl(music.image)} alt="" />
              <p className="c-cover__title">{music.title}</p>
              <p className="c-cover__artist">{music.artistName || "Unknown"}</p>
              <div className="c-tags">
                <span className="c-tag">{music.type}</span>
                {music.releaseDate && <span className="c-date">{new Date(music.releaseDate).getUTCFullYear()}</span>}
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
