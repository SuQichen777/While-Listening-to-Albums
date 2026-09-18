import { Link, NavLink } from "react-router-dom";
import { useAuth } from "../context/useAuth.js";

const columns = [
  [
    { label: "My Music", to: "/music" },
    { label: "Albums", to: "/music/album" },
    { label: "Singles", to: "/music/single" },
  ],
  [
    { label: "Search", to: "/music/search" },
    { label: "Blog", to: "/blog" },
    { label: "Write", to: "/blog/new" },
  ],
];

const guestColumns = [
  [
    { label: "Log In", to: "/login" },
    { label: "Register", to: "/register" },
  ],
];

function NavColumn({ links, offset }) {
  return (
    <div className="l-nav__column">
      {links.map((link, index) => (
        <NavLink
          key={link.to}
          to={link.to} end
          style={{ "--i": offset + index }}
          className={({ isActive }) => (isActive ? "l-nav__link reveal is-active" : "l-nav__link reveal")}
        >
          {link.label}
        </NavLink>
      ))}
    </div>
  );
}

export default function Header() {
  const { user, loading, logout } = useAuth();

  return (
    <header className="l-header">
      <Link to="/" className="site-title">
        <span className="site-title__legal reveal">A private music journal</span>
        <span className="site-title__name reveal" style={{ "--i": 1 }}>听专辑的时候我在想些什么</span>
        <span className="site-title__en">
          <span className="reveal" style={{ "--i": 2 }}>While</span>
          <span className="reveal" style={{ "--i": 3 }}>Listening</span>
          <span className="reveal" style={{ "--i": 4 }}>to Albums</span>
        </span>
      </Link>

      {!loading && (
        <nav className="l-nav">
          {(user ? columns : guestColumns).map((links, index) => (
            <NavColumn key={index} links={links} offset={index * 2} />
          ))}
          {user && (
            <div className="l-nav__column">
              <span className="l-nav__user reveal" style={{ "--i": 4 }}>{user.username}</span>
              <button type="button" className="l-nav__link reveal" style={{ "--i": 5 }} onClick={logout}>Log Out</button>
            </div>
          )}
        </nav>
      )}

      <p className="l-side">© While Listening to Albums</p>
    </header>
  );
}
