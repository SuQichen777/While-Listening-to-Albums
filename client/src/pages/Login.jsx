import { useState } from "react";
import { Link, Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/useAuth.js";
import SectionHead from "../components/SectionHead.jsx";

export default function Login() {
  const { user, login } = useAuth();
  const location = useLocation();
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (user) return <Navigate to={location.state?.from || "/music"} replace />;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await login(name, password);
    } catch (err) {
      setError(err.message);
      setSubmitting(false);
    }
  };

  return (
    <div className="p-auth">
      <SectionHead title="Log In" />
      <form onSubmit={handleSubmit} className="c-form">
        <label className="c-field">
          <span className="c-field__label">Username or email</span>
          <input type="text" value={name} onChange={(e) => setName(e.target.value)} autoComplete="username" required />
        </label>
        <label className="c-field">
          <span className="c-field__label">Password</span>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" required />
        </label>
        {error && <p className="c-message c-message--error">{error}</p>}
        <div className="c-form__actions">
          <button type="submit" className="c-pill c-pill--fill" disabled={submitting}>{submitting ? "Logging in" : "Log In"}</button>
        </div>
      </form>
      <p className="p-auth__switch">No account yet? <Link to="/register" state={location.state} className="c-underline">Register</Link></p>
    </div>
  );
}
