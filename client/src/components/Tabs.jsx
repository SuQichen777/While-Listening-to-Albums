import { NavLink } from "react-router-dom";
import "./Tabs.css";

const tabs = [
  { label: "Music", to: "/music" },
  { label: "Album", to: "/music/album" },
  { label: "Single", to: "/music/single" },
  { label: "Search", to: "/music/search" },
  { label: "Blog", to: "/blog" },
];

export default function Tabs() {
  return (
    <div className="tabs">
      {tabs.map((tab) => (
        <NavLink
          key={tab.to}
          to={tab.to} end
          className={({ isActive }) =>
            isActive ? "tab active-tab" : "tab"
          }
        >
          {tab.label}
        </NavLink>
      ))}
    </div>
  );
}
