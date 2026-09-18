import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { apiFetch } from "../lib/api.js";
import { formatDate, revealStyle, coverUrl } from "../lib/format.js";
import SectionHead from "../components/SectionHead.jsx";

export default function BlogList() {
  const [blogs, setBlogs] = useState([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    apiFetch("/api/v1/blog/all")
      .then((res) => res.json())
      .then((data) => {
        setBlogs(Array.isArray(data) ? data : []);
        setLoaded(true);
      })
      .catch((err) => console.error("Error fetching blogs:", err));
  }, []);

  return (
    <div>
      <SectionHead title="My Blogs" linkTo="/blog/new" linkLabel="Write a new blog" />

      {loaded && blogs.length === 0 && <p className="c-empty">No blogs yet.</p>}
      {blogs.length > 0 && (
        <ul className="c-list">
          {blogs.map((blog, index) => (
            <li key={blog._id} className="c-list__item reveal" style={revealStyle(index)}>
              <Link to={`/blog/${blog.slug}`} className="c-list__row">
                <div className="c-list__body">
                  <h2 className="c-list__title">{blog.title}</h2>
                  <div className="c-tags">
                    <span className={blog.isPublic ? "c-tag c-tag--fill" : "c-tag"}>{blog.isPublic ? "Public" : "Private"}</span>
                    {blog.rate > 0 && <span className="c-tag">{blog.rate} / 10</span>}
                    {blog.referredWorkNumber > 0 && <span className="c-tag">{blog.referredWorkNumber} music</span>}
                    <span className="c-date">{formatDate(blog.createDate)}</span>
                  </div>
                </div>
                {blog.cover && (
                  <img referrerPolicy="no-referrer" src={coverUrl(blog.cover, 200)} alt="" className="c-list__image" />
                )}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
