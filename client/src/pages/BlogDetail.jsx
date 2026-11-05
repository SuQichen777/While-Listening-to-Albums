import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { apiFetch } from "../lib/api.js";
import { formatDate, coverUrl } from "../lib/format.js";

export default function BlogDetail() {
  const { slug } = useParams();
  const [blog, setBlog] = useState(null);

  useEffect(() => {
    apiFetch(`/api/v1/blog/${slug}`)
      .then((res) => res.json())
      .then((data) => setBlog(data))
      .catch((err) => console.error("Error fetching blog detail:", err));
  }, [slug]);

  if (!blog) return <p className="c-message">Loading</p>;
  if (blog.error) return <p className="c-empty">{blog.error}</p>;

  const works = (blog.referredWork || []).filter((work) => work.item);

  return (
    <article className="l-narrow">
      <header className="p-blog__head">
        <div>
          <h1 className="p-blog__title reveal">{blog.title}</h1>
          <div className="c-tags reveal" style={{ "--i": 1 }}>
            {blog.isMine
              ? <span className={blog.isPublic ? "c-tag c-tag--fill" : "c-tag"}>{blog.isPublic ? "Public" : "Private"}</span>
              : <span className="c-tag c-tag--fill">By {blog.author?.username}</span>}
            <span className="c-date">{formatDate(blog.createDate)}</span>
          </div>
          {blog.rate > 0 && (
            <p className="p-blog__rate reveal" style={{ "--i": 2 }}>{blog.rate}<small>/ 10</small></p>
          )}
        </div>
        {blog.cover && (
          <img referrerPolicy="no-referrer" src={coverUrl(blog.cover, 600)} alt="" className="p-blog__cover reveal" style={{ "--i": 3 }} />
        )}
      </header>

      <p className="c-prose">{blog.content || "No content."}</p>

      {works.length > 0 && (
        <section className="p-blog__referred">
          <h2 className="c-subhead">Referred Music</h2>
          <ul className="c-list">
            {works.map((work, index) => (
              <li key={index} className="c-list__item">
                <Link to={`/music/${work.item.slug}`} className="c-list__row">
                  {work.item.image && (
                    <img referrerPolicy="no-referrer" src={coverUrl(work.item.image, 200)} alt="" className="c-list__image" />
                  )}
                  <div className="c-list__body">
                    <p className="c-list__title">{work.item.title || "Untitled"}</p>
                    <p className="c-list__sub">{work.item.artistName || "Unknown"}</p>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </article>
  );
}
