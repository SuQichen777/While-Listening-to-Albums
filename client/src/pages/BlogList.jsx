import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { apiFetch } from "../lib/api.js";

export default function BlogList() {
  const [blogs, setBlogs] = useState([]);

  useEffect(() => {
    apiFetch("/api/v1/blog/all")
      .then((res) => res.json())
      .then((data) => setBlogs(data))
      .catch((err) => console.error("Error fetching blogs:", err));
  }, []);

  if (blogs.length === 0) return <div>No blogs available yet.</div>;

  return (
    <div className="blog-list-container">
      <h1 className="blog-list-title">All Blogs</h1>

      <ul className="blog-list">
        {blogs.map((blog) => (
          <li key={blog._id} className="blog-item">
            <Link to={`/blog/${blog.slug}`} className="blog-link">
              {blog.cover && (
                <img referrerPolicy="no-referrer" src={blog.cover} alt={blog.title} className="blog-cover" />
              )}
              <div className="blog-info">
                <h2 className="blog-title">{blog.title}</h2>
                <p className="blog-date">{new Date(blog.createDate).toLocaleDateString()}</p>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
