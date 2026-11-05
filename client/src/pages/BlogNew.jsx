import { useState, useEffect } from "react";
import { apiFetch } from "../lib/api.js";
import { useNavigate } from "react-router-dom";
import SectionHead from "../components/SectionHead.jsx";

export default function BlogNew() {
  const [title, setTitle] = useState("");
  const [cover, setCover] = useState("");
  const [content, setContent] = useState("");
  const [rate, setRate] = useState("");
  const [isPublic, setIsPublic] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [musics, setMusics] = useState([]);
  const [referredWorkFields, setReferredWorkFields] = useState([
    { referredModel: "Music", item: "" }
  ]);

  const navigate = useNavigate();

  useEffect(() => {
    apiFetch("/api/v1/music/all")
      .then((res) => res.json())
      .then((data) => setMusics(Array.isArray(data) ? data : []))
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
      setError("Title and content are required.");
      return;
    }

    const filteredReferredWork = referredWorkFields.filter(f => f.item);
    const payload = {
      title,
      cover,
      content,
      rate: rate === "" ? 0 : parseFloat(rate),
      isPublic,
      referredWork: filteredReferredWork
    };

    setError("");
    setSubmitting(true);
    try {
      const res = await apiFetch("/api/v1/blog/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        navigate("/blog");
      } else {
        const err = await res.json();
        setError(err.error);
        setSubmitting(false);
      }
    } catch (err) {
      console.error(err);
      setError("Network error.");
      setSubmitting(false);
    }
  };

  return (
    <div className="l-narrow">
      <SectionHead title="Write a New Blog" linkTo="/blog" linkLabel="My Blogs" />

      <form onSubmit={handleSubmit} className="c-form">
        <label className="c-field">
          <span className="c-field__label">Title</span>
          <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} required />
        </label>

        <label className="c-field">
          <span className="c-field__label">Content</span>
          <textarea rows={12} value={content} onChange={(e) => setContent(e.target.value)} placeholder="What were you thinking while listening?" required />
        </label>

        <label className="c-field" style={{ maxWidth: 200 }}>
          <span className="c-field__label">Rate, 1-10, decimals are fine (optional)</span>
          <input type="number" min="1" max="10" step="0.1" value={rate} onChange={(e) => setRate(e.target.value)} placeholder="8.5" />
        </label>

        <div className="c-field">
          <span className="c-field__label">Referred music, from your list</span>
          {referredWorkFields.map((field, index) => (
            <div key={index} style={{ display: "flex", gap: 24, alignItems: "flex-end" }}>
              <select value={field.item} onChange={(e) => handleWorkChange(index, e.target.value)} aria-label={`Referred music ${index + 1}`}>
                <option value="">Select a music</option>
                {musics.map(w => (
                  <option key={w._id} value={w._id}>
                    {w.title} {w.artistName ? `/ ${w.artistName}` : ""}
                  </option>
                ))}
              </select>
              {index > 0 && (
                <button type="button" className="c-text-button" onClick={() => removeReferredWorkField(index)}>Remove</button>
              )}
            </div>
          ))}
          <div style={{ marginTop: 12 }}>
            <button type="button" className="c-text-button c-underline" onClick={addReferredWorkField}>・Add one more</button>
          </div>
        </div>

        <label className="c-field">
          <span className="c-field__label">Cover image URL (default: cover of the first referred music)</span>
          <input type="text" value={cover} onChange={(e) => setCover(e.target.value)} />
        </label>

        <label className="c-checkbox">
          <input type="checkbox" checked={isPublic} onChange={(e) => setIsPublic(e.target.checked)} />
          Public: other users can read this blog with its link (private by default)
        </label>

        {error && <p className="c-message c-message--error">{error}</p>}
        <div className="c-form__actions">
          <button type="submit" className="c-pill c-pill--fill" disabled={submitting}>{submitting ? "Submitting" : "Submit Blog"}</button>
        </div>
      </form>
    </div>
  );
}
