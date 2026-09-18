import { useState } from "react";

export default function SearchBar({ onSearch, options = ["title", "artist"] }) {
  const [query, setQuery] = useState("");
  const [type, setType] = useState(options[0]); 

  const handleSubmit = (e) => {
    e.preventDefault();
    onSearch(query, type);
  };

  return (
    <form
      onSubmit={handleSubmit}
      style={{ display: "flex", gap: "1rem", marginBottom: "1rem", alignItems: "center" }}
    >
      <input
        type="text"
        placeholder={`Search by ${type}`}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      <select value={type} onChange={(e) => setType(e.target.value)}>
        {options.map((opt) => (
          <option key={opt} value={opt}>
            {opt.charAt(0).toUpperCase() + opt.slice(1)}
          </option>
        ))}
      </select>
      <button type="submit">Search</button>
    </form>
  );
}
