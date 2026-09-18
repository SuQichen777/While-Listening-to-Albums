import { useState } from "react";

export default function SearchBar({ onSearch, options = ["title", "artist"] }) {
  const [query, setQuery] = useState("");
  const [type, setType] = useState(options[0]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSearch(query, type);
  };

  return (
    <form onSubmit={handleSubmit} className="c-search">
      <input
        type="text"
        className="c-input"
        placeholder={`Filter by ${type}`}
        aria-label={`Filter by ${type}`}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      <div className="c-search__options">
        {options.map((opt) => (
          <button
            type="button"
            key={opt}
            className={opt === type ? "c-tag c-tag--fill c-search__option" : "c-tag c-search__option"}
            aria-pressed={opt === type}
            onClick={() => setType(opt)}
          >
            {opt.charAt(0).toUpperCase() + opt.slice(1)}
          </button>
        ))}
      </div>
      <button type="submit" className="c-pill">Filter</button>
    </form>
  );
}
