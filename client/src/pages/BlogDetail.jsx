import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { apiFetch } from "../lib/api.js";

export default function BlogDetail() {
  const { slug } = useParams();
  const [blog, setBlog] = useState(null);

  useEffect(() => {
    apiFetch(`/api/v1/blog/${slug}`)
      .then((res) => res.json())
      .then((data) => setBlog(data))
      .catch((err) => console.error("Error fetching blog detail:", err));
  }, [slug]);

  if (!blog) return <div>Loading...</div>;
  if (blog.error) return <div>{blog.error}</div>;

  return (
    <div className="blog-detail-container">
      <h1 className="blog-detail-title">{blog.title}</h1>

      {blog.cover && (
        <div className="blog-detail-cover-wrapper">
          <img referrerPolicy="no-referrer" src={blog.cover} alt={blog.title} className="blog-detail-cover" />
        </div>
      )}

      <div className="blog-detail-meta">
        <p><strong>Created:</strong> {new Date(blog.createDate).toLocaleDateString()}</p>
        {blog.rate > 0 && (
          <p><strong>Rate:</strong> {blog.rate} / 10</p>
        )}
      </div>

      <div className="blog-detail-content">
        {blog.content || "No content."}
      </div>

      {blog.referredWork && blog.referredWork.length > 0 && (
        <div className="blog-detail-referred">
          <h2>Referred Works</h2>
          <ul>
            {blog.referredWork.map((work, index) => (
              <li key={index}>
                {work.item && (
                  <Link to={`/music/${work.item.slug}`} className="referred-item">
                    {work.item.image && (
                      <img referrerPolicy="no-referrer" src={work.item.image} alt={work.item.title || "Work"} className="referred-image" />
                    )}
                    <div className="referred-info">
                      <p><strong>Title:</strong> {work.item.title || "Untitled"}</p>
                      <p><strong>Artist:</strong> {work.item.artistName || "Unknown"}</p>
                    </div>
                  </Link>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
