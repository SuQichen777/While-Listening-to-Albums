import { useState, useEffect } from "react";
import { apiFetch } from "../lib/api.js";
import { useNavigate } from "react-router-dom";

export default function BlogNew() {
  const [title, setTitle] = useState("");
  const [cover, setCover] = useState("");
  const [content, setContent] = useState("");
  const [rate, setRate] = useState("");

  const [musics, setMusics] = useState([]);
  const [referredWorkFields, setReferredWorkFields] = useState([
    { referredModel: "Music", item: "" }
  ]);

  const navigate = useNavigate();

  useEffect(() => {
    apiFetch("/api/v1/music/all")
      .then((res) => res.json())
      .then((data) => setMusics(data))
      .catch((err) => console.error("Failed to load music list:", err));
  }, []);

  const handleWorkChange = (index, value) => {
    const updated = [...referredWorkFields];
    updated[index] = { ...updated[index], item: value };
    setReferredWorkFields(updated);
  };

  const addReferredWorkField = () => {
    setReferredWorkFields([...referredWorkFields, { referredModel: "Music", item: "" }]);
  };

  const removeReferredWorkField = (index) => {
    const updated = [...referredWorkFields];
    updated.splice(index, 1);
    setReferredWorkFields(updated);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      alert("Title and content are required.");
      return;
    }

    const filteredReferredWork = referredWorkFields.filter(f => f.item);
    const payload = {
      title,
      cover,
      content,
      rate: rate === "" ? 0 : parseFloat(rate),
      referredWorkNumber: filteredReferredWork.length,
      referredWork: filteredReferredWork
    };

    try {
      const res = await apiFetch("/api/v1/blog/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        alert("✅ Blog created!");
        navigate("/blog");
      } else {
        const err = await res.json();
        alert("❌ Failed: " + err.error);
      }
    } catch (err) {
      console.error(err);
      alert("❌ Network error.");
    }
  };

  return (
    <div style={{ maxWidth: "800px", margin: "2rem auto", padding: "2rem", background: "#fff", borderRadius: "10px", boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }}>
      <h1 style={{ textAlign: "center", marginBottom: "2rem" }}>Write a New Blog</h1>
      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        <input
          type="text"
          placeholder="Blog title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />
        <input
          type="text"
          placeholder="Cover image URL (default: cover of the first referred music)"
          value={cover}
          onChange={(e) => setCover(e.target.value)}
        />
        <textarea
          placeholder="Write your content here..."
          rows={8}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          required
          style={{ resize: "vertical", fontSize: "1rem", padding: "0.75rem" }}
        />
        <input
          type="number"
          min="1"
          max="10"
          step="0.1"
          placeholder="Rate this, 1-10, decimals are fine (optional)"
          value={rate}
          onChange={(e) => setRate(e.target.value)}
        />

        <div>
          <h3>Referred Music</h3>
          {referredWorkFields.map((field, index) => (
            <div key={index} style={{ display: "flex", gap: "1rem", alignItems: "center", marginBottom: "0.75rem" }}>
              <select
                value={field.item}
                onChange={(e) => handleWorkChange(index, e.target.value)}
              >
                <option value="">Select a music</option>
                {musics.map(w => (
                  <option key={w._id} value={w._id}>
                    {w.title} {w.artistName ? `- ${w.artistName}` : ""}
                  </option>
                ))}
              </select>

              {index > 0 && (
                <button type="button" onClick={() => removeReferredWorkField(index)}>Remove</button>
              )}
            </div>
          ))}
          <button type="button" onClick={addReferredWorkField}>+ Add one</button>
        </div>

        <button type="submit">Submit Blog</button>
      </form>
    </div>
  );
}
