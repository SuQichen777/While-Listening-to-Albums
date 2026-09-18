import { Link } from "react-router-dom";

// page title on the left, one optional "・link" in the middle
export default function SectionHead({ title, linkTo, linkLabel }) {
  return (
    <div className="c-section-head">
      <h1 className="c-section-head__title reveal">{title}</h1>
      {linkTo && (
        <Link to={linkTo} className="c-section-head__link c-underline reveal" style={{ "--i": 1 }}>{linkLabel}</Link>
      )}
    </div>
  );
}
